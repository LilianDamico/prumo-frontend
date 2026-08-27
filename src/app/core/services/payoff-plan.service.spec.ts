import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { Debt, DebtStatus, DebtType, DebtPayoffStrategyType, FinancialPosition, FinancialPositionStatus } from '../models';
import { currentReferenceMonth } from '../utils/date.util';
import { DebtService } from './debt.service';
import { FinancialPositionService } from './financial-position.service';
import { PayoffPlanService } from './payoff-plan.service';

const REFERENCE_MONTH = currentReferenceMonth();

function debt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'debt-1',
    creditor: 'Banco X',
    description: 'Empréstimo',
    type: DebtType.PERSONAL_LOAN,
    originalAmount: 1000,
    currentBalance: 800,
    dueDay: 15,
    startDate: `${REFERENCE_MONTH}-01`,
    status: DebtStatus.ACTIVE,
    ...overrides,
  };
}

function position(overrides: Partial<FinancialPosition> = {}): FinancialPosition {
  return {
    referenceMonth: REFERENCE_MONTH,
    totalIncome: 4800,
    totalPaidExpenses: 0,
    totalPendingExpenses: 2000,
    totalMandatoryInstallments: 0,
    plannedReserve: 0,
    availableAmount: 500,
    status: FinancialPositionStatus.NO_PRUMO,
    ...overrides,
  };
}

function configureTestBed(fixtures: { debts?: Debt[]; availableAmount?: number }): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: DebtService, useValue: { getAll: () => of(fixtures.debts ?? []) } },
      {
        provide: FinancialPositionService,
        useValue: { getPosition: () => of(position({ availableAmount: fixtures.availableAmount ?? 500 })) },
      },
    ],
  });
}

describe('PayoffPlanService', () => {
  it('retorna dados insuficientes quando não há dívidas ativas', async () => {
    configureTestBed({ debts: [] });

    const service = TestBed.inject(PayoffPlanService);
    const output = await firstValueFrom(service.getPlan());

    expect(output.status).toBe('INSUFFICIENT_DATA');
  });

  it('retorna dados insuficientes quando não há valor mensal disponível', async () => {
    configureTestBed({
      debts: [debt({ minimumPayment: 0 })],
      availableAmount: -100,
    });

    const service = TestBed.inject(PayoffPlanService);
    const output = await firstValueFrom(service.getPlan());

    expect(output.status).toBe('INSUFFICIENT_DATA');
  });

  it('monta um plano com as duas estratégias (avalanche e snowball)', async () => {
    configureTestBed({
      debts: [
        debt({ id: 'a', currentBalance: 500, originalAmount: 1000, interestRateMonthly: 5, minimumPayment: 50 }),
        debt({ id: 'b', currentBalance: 200, originalAmount: 400, interestRateMonthly: 12, minimumPayment: 30 }),
      ],
      availableAmount: 500,
    });

    const service = TestBed.inject(PayoffPlanService);
    const output = await firstValueFrom(service.getPlan());

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      expect(output.result.simulations).toHaveLength(2);
      const avalanche = output.result.simulations.find((s) => s.strategy === DebtPayoffStrategyType.AVALANCHE);
      const snowball = output.result.simulations.find((s) => s.strategy === DebtPayoffStrategyType.SNOWBALL);
      expect(avalanche?.steps.map((s) => s.debtId)).toEqual(['b', 'a']);
      expect(snowball?.steps.map((s) => s.debtId)).toEqual(['b', 'a']);
      expect(avalanche?.hasUnknownInterestRate).toBe(false);
      expect(avalanche?.estimatedInterestPaid).toBeDefined();
    }
  });

  it('calcula corretamente o progresso (eliminado = original - saldo atual)', async () => {
    configureTestBed({
      debts: [
        debt({ id: 'a', originalAmount: 1000, currentBalance: 400, minimumPayment: 50 }),
        debt({ id: 'b', originalAmount: 500, currentBalance: 500, minimumPayment: 30 }),
      ],
      availableAmount: 300,
    });

    const service = TestBed.inject(PayoffPlanService);
    const output = await firstValueFrom(service.getPlan());

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      expect(output.result.progress.totalOriginalAmount).toBe(1500);
      expect(output.result.progress.totalCurrentBalance).toBe(900);
      expect(output.result.progress.totalEliminated).toBe(600);
    }
  });

  it('não calcula estimativa de juros quando alguma dívida tem taxa desconhecida', async () => {
    configureTestBed({
      debts: [
        debt({ id: 'a', currentBalance: 500, interestRateMonthly: 5, minimumPayment: 50 }),
        debt({ id: 'b', currentBalance: 200, minimumPayment: 30 }),
      ],
      availableAmount: 500,
    });

    const service = TestBed.inject(PayoffPlanService);
    const output = await firstValueFrom(service.getPlan());

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      for (const simulation of output.result.simulations) {
        expect(simulation.hasUnknownInterestRate).toBe(true);
        expect(simulation.estimatedInterestPaid).toBeUndefined();
      }
    }
  });

  it('calcula um tempo estimado de quitação finito quando o valor disponível é suficiente', async () => {
    configureTestBed({
      debts: [debt({ id: 'a', currentBalance: 300, minimumPayment: 300 })],
      availableAmount: 100,
    });

    const service = TestBed.inject(PayoffPlanService);
    const output = await firstValueFrom(service.getPlan());

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      for (const simulation of output.result.simulations) {
        expect(simulation.estimatedMonthsToPayoff).toBe(1);
      }
    }
  });
});
