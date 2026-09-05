import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';

import { Debt, DebtStatus, PayoffPlanOutput, PayoffPlanProgress, PayoffPlanStep, PayoffSimulation } from '../models';
import { addMonthsToReferenceMonth, currentReferenceMonth } from '../utils/date.util';
import { AvalancheStrategy, DebtStrategy, SnowballStrategy } from './debt-strategy';
import { DebtService } from './debt.service';
import { FinancialPositionService } from './financial-position.service';

/** Limite de segurança para a simulação mês a mês (50 anos), evitando laços infinitos quando o valor disponível é insuficiente. */
const MAX_SIMULATION_MONTHS = 600;

/**
 * Calcula "Meu Caminho": compara as estratégias de quitação de dívidas
 * (avalanche e snowball) sem nunca decidir pelo usuário. Reaproveita
 * `FinancialPositionService` para saber quanto sobra por mês, em vez de
 * duplicar a leitura de contas/despesas/receitas.
 */
@Injectable({ providedIn: 'root' })
export class PayoffPlanService {
  private readonly debtService = inject(DebtService);
  private readonly financialPositionService = inject(FinancialPositionService);

  private readonly strategies: DebtStrategy[] = [new AvalancheStrategy(), new SnowballStrategy()];

  /** Monta o plano de quitação com todas as estratégias disponíveis. */
  getPlan(): Observable<PayoffPlanOutput> {
    return combineLatest([this.debtService.getAll(), this.financialPositionService.getPosition()]).pipe(
      map(([debts, position]) => this.calculate(debts, position.availableAmount)),
    );
  }

  private calculate(debts: Debt[], extraAvailableAmount: number): PayoffPlanOutput {
    const activeDebts = debts.filter((debt) => debt.status === DebtStatus.ACTIVE);

    if (activeDebts.length === 0) {
      return {
        status: 'INSUFFICIENT_DATA',
        missingData: {
          message: 'Ainda não há dívidas ativas para montar um plano de quitação.',
          hint: 'Cadastre suas dívidas para acompanhar "Meu Caminho".',
        },
      };
    }

    const totalMinimumPayments = sum(
      activeDebts.map((debt) => debt.installmentAmount ?? debt.minimumPayment ?? 0),
    );
    const monthlyAvailableForPayoff = totalMinimumPayments + Math.max(extraAvailableAmount, 0);

    if (monthlyAvailableForPayoff <= 0) {
      return {
        status: 'INSUFFICIENT_DATA',
        missingData: {
          message: 'Ainda não temos um valor mensal disponível para direcionar às dívidas.',
          hint: 'Cadastre suas contas e receitas para sabermos quanto sobra por mês.',
        },
      };
    }

    const progress = this.calculateProgress(debts);
    const simulations = this.strategies.map((strategy) =>
      this.simulateStrategy(strategy, activeDebts, monthlyAvailableForPayoff, progress.totalEliminated),
    );

    return { status: 'OK', result: { progress, simulations } };
  }

  private calculateProgress(debts: Debt[]): PayoffPlanProgress {
    const activeDebts = debts.filter((debt) => debt.status === DebtStatus.ACTIVE);
    const totalOriginalAmount = sum(debts.map((debt) => debt.originalAmount));
    const totalCurrentBalance = sum(activeDebts.map((debt) => debt.currentBalance));
    const totalEliminated = totalOriginalAmount - sum(debts.map((debt) => debt.currentBalance));

    return { totalOriginalAmount, totalCurrentBalance, totalEliminated };
  }

  private simulateStrategy(
    strategy: DebtStrategy,
    activeDebts: Debt[],
    monthlyAvailableForPayoff: number,
    totalEliminated: number,
  ): PayoffSimulation {
    const orderedDebts = strategy.order(activeDebts);
    const totalDebtAmount = sum(activeDebts.map((debt) => debt.currentBalance));
    const hasUnknownInterestRate = activeDebts.some((debt) => debt.interestRateMonthly === undefined);

    const steps: PayoffPlanStep[] = orderedDebts.map((debt, index) => ({
      debtId: debt.id,
      order: index + 1,
    }));

    const { monthsToPayoff, interestPaid, payoffMonthByDebtId } = this.runAmortization(
      orderedDebts,
      monthlyAvailableForPayoff,
    );

    const stepsWithPayoffMonth: PayoffPlanStep[] = steps.map((step) => ({
      ...step,
      estimatedPayoffMonth: payoffMonthByDebtId.get(step.debtId),
    }));

    return {
      strategy: strategy.type,
      title: strategy.title,
      technicalName: strategy.technicalName,
      totalDebtAmount,
      totalEliminated,
      monthlyAvailableForPayoff,
      steps: stepsWithPayoffMonth,
      estimatedMonthsToPayoff: monthsToPayoff,
      estimatedInterestPaid: hasUnknownInterestRate ? undefined : interestPaid,
      hasUnknownInterestRate,
    };
  }

  /**
   * Simula o pagamento mês a mês: cada dívida recebe seu pagamento mínimo, e
   * o valor restante disponível é direcionado à dívida de maior prioridade
   * ainda ativa, na ordem definida pela estratégia. Dívidas sem taxa de
   * juros conhecida são tratadas como sem acréscimo de juros nesta
   * simulação (nunca inventamos uma taxa), mas o resultado só é exibido como
   * "estimativa de juros" quando todas as dívidas têm taxa conhecida.
   */
  private runAmortization(
    orderedDebts: Debt[],
    monthlyAvailableForPayoff: number,
  ): { monthsToPayoff: number; interestPaid: number; payoffMonthByDebtId: Map<string, string> } {
    const balances = new Map(orderedDebts.map((debt) => [debt.id, debt.currentBalance]));
    const payoffMonthByDebtId = new Map<string, string>();

    let month = 0;
    let interestPaid = 0;
    const referenceMonth = currentReferenceMonth();

    while (month < MAX_SIMULATION_MONTHS && [...balances.values()].some((balance) => balance > 0)) {
      month += 1;

      for (const debt of orderedDebts) {
        const balance = balances.get(debt.id) ?? 0;
        if (balance <= 0 || debt.interestRateMonthly === undefined) {
          continue;
        }
        const interest = balance * (debt.interestRateMonthly / 100);
        interestPaid += interest;
        balances.set(debt.id, balance + interest);
      }

      let remainingPayment = monthlyAvailableForPayoff;

      for (const debt of orderedDebts) {
        const balance = balances.get(debt.id) ?? 0;
        if (balance <= 0) {
          continue;
        }
        const minimumPayment = Math.min(balance, debt.installmentAmount ?? debt.minimumPayment ?? 0);
        const payment = Math.min(balance, minimumPayment);
        balances.set(debt.id, balance - payment);
        remainingPayment -= payment;
      }

      for (const debt of orderedDebts) {
        if (remainingPayment <= 0) {
          break;
        }
        const balance = balances.get(debt.id) ?? 0;
        if (balance <= 0) {
          continue;
        }
        const payment = Math.min(balance, remainingPayment);
        balances.set(debt.id, balance - payment);
        remainingPayment -= payment;
      }

      for (const debt of orderedDebts) {
        if (!payoffMonthByDebtId.has(debt.id) && (balances.get(debt.id) ?? 0) <= 0) {
          payoffMonthByDebtId.set(debt.id, addMonthsToReferenceMonth(referenceMonth, month));
        }
      }
    }

    return { monthsToPayoff: month, interestPaid, payoffMonthByDebtId };
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
