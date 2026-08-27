import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';

import {
  Debt,
  DebtStatus,
  Expense,
  ExpenseStatus,
  Income,
  IsoMonthString,
  MonthlyBudget,
  PurchasePaymentMethod,
  PurchaseSimulationMonthImpact,
  PurchaseSimulationOutcome,
  PurchaseSimulationOutput,
  PurchaseSimulationRequest,
} from '../models';
import { addMonthsToReferenceMonth, isDateInMonth } from '../utils/date.util';
import { distributeInstallmentAmounts } from '../utils/interest.util';
import { BudgetService } from './budget.service';
import { DebtService } from './debt.service';
import { ExpenseService } from './expense.service';
import { IncomeService } from './income.service';

/**
 * Interface de entrada mínima usada internamente para descrever a compra a
 * ser simulada. Compras "à vista" são tratadas como uma única parcela.
 */
type NormalizedRequest = PurchaseSimulationRequest & { installmentsCount: number };

/**
 * Limite mínimo (em % da renda do mês) que deve sobrar, depois da compra,
 * para o resultado ser considerado CONFORTÁVEL. Abaixo disso, mas ainda
 * positivo, o resultado é POSSÍVEL_MAS_APERTA.
 */
const COMFORTABLE_THRESHOLD_RATIO = 0.15;

/**
 * Calcula o impacto de uma compra pretendida sobre os meses afetados,
 * reaproveitando os mesmos dados usados por `FinancialPositionService`
 * (renda, despesas, dívidas e reserva planejada), sem duplicar suas regras
 * de leitura de despesas/receitas do mês.
 */
@Injectable({ providedIn: 'root' })
export class PurchaseSimulationService {
  private readonly incomeService = inject(IncomeService);
  private readonly expenseService = inject(ExpenseService);
  private readonly debtService = inject(DebtService);
  private readonly budgetService = inject(BudgetService);

  /** Simula o impacto de uma compra, mês a mês, ao longo de todo o parcelamento. */
  simulate(request: PurchaseSimulationRequest): Observable<PurchaseSimulationOutput> {
    const normalized = this.normalize(request);
    const affectedMonths = this.affectedMonths(normalized);

    return combineLatest([
      this.incomeService.getAll(),
      this.expenseService.getAll(),
      this.debtService.getAll(),
      combineLatest(affectedMonths.map((month) => this.budgetService.getByMonth(month))),
    ]).pipe(
      map(([incomes, expenses, debts, budgets]) =>
        this.calculate(normalized, affectedMonths, incomes, expenses, debts, budgets),
      ),
    );
  }

  private normalize(request: PurchaseSimulationRequest): NormalizedRequest {
    const installmentsCount =
      request.paymentMethod === PurchasePaymentMethod.CASH ? 1 : Math.max(2, request.installmentsCount);
    return { ...request, installmentsCount };
  }

  private affectedMonths(request: NormalizedRequest): IsoMonthString[] {
    return Array.from({ length: request.installmentsCount }, (_, index) =>
      addMonthsToReferenceMonth(request.firstChargeMonth, index),
    );
  }

  private calculate(
    request: NormalizedRequest,
    affectedMonths: IsoMonthString[],
    incomes: Income[],
    expenses: Expense[],
    debts: Debt[],
    budgets: Array<MonthlyBudget | undefined>,
  ): PurchaseSimulationOutput {
    if (!request.amount || request.amount <= 0) {
      return {
        status: 'INSUFFICIENT_DATA',
        missingData: {
          message: 'Informe um valor de compra maior que zero para simular.',
        },
      };
    }

    if (incomes.length === 0) {
      return {
        status: 'INSUFFICIENT_DATA',
        missingData: {
          message: 'Ainda faltam algumas informações para fazer uma simulação confiável.',
          hint: 'Cadastre sua renda mensal para continuarmos.',
        },
      };
    }

    const installmentAmounts = distributeInstallmentAmounts(request.amount, request.installmentsCount);
    const activeDebts = debts.filter((debt) => debt.status === DebtStatus.ACTIVE);

    const monthlyImpact: PurchaseSimulationMonthImpact[] = affectedMonths.map((referenceMonth, index) =>
      this.monthImpact(
        referenceMonth,
        installmentAmounts[index],
        incomes,
        expenses,
        activeDebts,
        budgets[index],
      ),
    );

    const tightestMonth = monthlyImpact.reduce((tightest, month) =>
      month.projectedAvailableAfterPurchase < tightest.projectedAvailableAfterPurchase ? month : tightest,
    );

    const outcome = this.resolveOutcome(tightestMonth);

    return {
      status: 'OK',
      result: { request, monthlyImpact, tightestMonth, outcome },
    };
  }

  private monthImpact(
    referenceMonth: IsoMonthString,
    purchaseAmount: number,
    incomes: Income[],
    expenses: Expense[],
    activeDebts: Debt[],
    budget: MonthlyBudget | undefined,
  ): PurchaseSimulationMonthImpact {
    const monthIncomes = incomes.filter((income) => isDateInMonth(income.incomeDate, referenceMonth));
    const monthExpenses = expenses.filter(
      (expense) =>
        isDateInMonth(expense.dueDate, referenceMonth) && expense.status !== ExpenseStatus.CANCELLED,
    );

    const projectedIncome = sum(monthIncomes.map((income) => income.amount));
    const totalExpenses = sum(monthExpenses.map((expense) => expense.amount));
    const totalMandatoryInstallments = sum(
      activeDebts.map((debt) => debt.installmentAmount ?? debt.minimumPayment ?? 0),
    );
    const plannedReserve = budget?.plannedReserve ?? 0;

    const projectedCommitments = totalExpenses + totalMandatoryInstallments + plannedReserve;
    const projectedAvailableBeforePurchase = projectedIncome - projectedCommitments;
    const projectedAvailableAfterPurchase = projectedAvailableBeforePurchase - purchaseAmount;

    return {
      referenceMonth,
      projectedIncome,
      projectedCommitments,
      purchaseAmount,
      projectedAvailableBeforePurchase,
      projectedAvailableAfterPurchase,
    };
  }

  private resolveOutcome(tightestMonth: PurchaseSimulationMonthImpact): PurchaseSimulationOutcome {
    if (tightestMonth.projectedAvailableAfterPurchase < 0) {
      return PurchaseSimulationOutcome.ALTO_RISCO;
    }

    const comfortableFloor = tightestMonth.projectedIncome * COMFORTABLE_THRESHOLD_RATIO;
    if (tightestMonth.projectedAvailableAfterPurchase < comfortableFloor) {
      return PurchaseSimulationOutcome.POSSIVEL_MAS_APERTA;
    }

    return PurchaseSimulationOutcome.CONFORTAVEL;
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
