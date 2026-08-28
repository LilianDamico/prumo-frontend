import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import {
  Debt,
  DebtStatus,
  DebtType,
  Expense,
  ExpenseStatus,
  Income,
  MonthlyBudget,
  PurchasePaymentMethod,
  PurchaseSimulationOutcome,
} from '../models';
import { addMonthsToReferenceMonth, currentReferenceMonth } from '../utils/date.util';
import { BudgetService } from './budget.service';
import { DebtService } from './debt.service';
import { ExpenseService } from './expense.service';
import { IncomeService } from './income.service';
import { PurchaseSimulationService } from './purchase-simulation.service';

const REFERENCE_MONTH = currentReferenceMonth();

function income(overrides: Partial<Income> = {}): Income {
  return {
    id: 'inc-1',
    accountId: 'acc-1',
    description: 'Salário',
    amount: 4800,
    incomeDate: `${REFERENCE_MONTH}-05`,
    categoryId: 'salario',
    recurring: true,
    ...overrides,
  };
}

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    accountId: 'acc-1',
    description: 'Contas fixas',
    amount: 2000,
    dueDate: `${REFERENCE_MONTH}-10`,
    paymentDate: null,
    categoryId: 'moradia',
    recurring: true,
    status: ExpenseStatus.PENDING,
    ...overrides,
  };
}

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

function configureTestBed(fixtures: {
  incomes?: Income[];
  expenses?: Expense[];
  debts?: Debt[];
  budgets?: Record<string, MonthlyBudget>;
}): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: IncomeService, useValue: { getAll: () => of(fixtures.incomes ?? []) } },
      { provide: ExpenseService, useValue: { getAll: () => of(fixtures.expenses ?? []) } },
      { provide: DebtService, useValue: { getAll: () => of(fixtures.debts ?? []) } },
      {
        provide: BudgetService,
        useValue: {
          getByMonth: (month: string) => of(fixtures.budgets?.[month]),
        },
      },
    ],
  });
}

describe('PurchaseSimulationService', () => {
  it('classifica como CONFORTAVEL uma compra à vista que cabe bem no orçamento', async () => {
    configureTestBed({
      incomes: [income({ amount: 4800 })],
      expenses: [expense({ amount: 2000 })],
    });

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 300,
        paymentMethod: PurchasePaymentMethod.CASH,
        installmentsCount: 1,
        firstChargeMonth: REFERENCE_MONTH,
      }),
    );

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      expect(output.result.outcome).toBe(PurchaseSimulationOutcome.CONFORTAVEL);
      expect(output.result.monthlyImpact).toHaveLength(1);
    }
  });

  it('classifica como CONFORTAVEL uma compra parcelada que cabe bem no orçamento', async () => {
    const months = Array.from({ length: 6 }, (_, index) => addMonthsToReferenceMonth(REFERENCE_MONTH, index));

    configureTestBed({
      incomes: months.map((month, index) =>
        income({ id: `inc-${index}`, amount: 4800, incomeDate: `${month}-05` }),
      ),
      expenses: months.map((month, index) =>
        expense({ id: `exp-${index}`, amount: 2000, dueDate: `${month}-10` }),
      ),
    });

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 1200,
        paymentMethod: PurchasePaymentMethod.INSTALLMENTS,
        installmentsCount: 6,
        firstChargeMonth: REFERENCE_MONTH,
      }),
    );

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      expect(output.result.outcome).toBe(PurchaseSimulationOutcome.CONFORTAVEL);
      expect(output.result.monthlyImpact).toHaveLength(6);
      expect(output.result.monthlyImpact[0].purchaseAmount).toBeCloseTo(200);
    }
  });

  it('classifica como POSSIVEL_MAS_APERTA quando sobra pouco em relação à renda', async () => {
    configureTestBed({
      incomes: [income({ amount: 3000 })],
      expenses: [expense({ amount: 2400 })],
    });

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 400,
        paymentMethod: PurchasePaymentMethod.CASH,
        installmentsCount: 1,
        firstChargeMonth: REFERENCE_MONTH,
      }),
    );

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      expect(output.result.outcome).toBe(PurchaseSimulationOutcome.POSSIVEL_MAS_APERTA);
    }
  });

  it('classifica como ALTO_RISCO quando a compra deixa o saldo negativo', async () => {
    configureTestBed({
      incomes: [income({ amount: 3000 })],
      expenses: [expense({ amount: 2800 })],
    });

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 500,
        paymentMethod: PurchasePaymentMethod.CASH,
        installmentsCount: 1,
        firstChargeMonth: REFERENCE_MONTH,
      }),
    );

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      expect(output.result.outcome).toBe(PurchaseSimulationOutcome.ALTO_RISCO);
      expect(output.result.tightestMonth.projectedAvailableAfterPurchase).toBeLessThan(0);
    }
  });

  it('projeta corretamente várias parcelas ao longo de vários meses', async () => {
    const monthTwo = addMonthsToReferenceMonth(REFERENCE_MONTH, 1);
    const monthThree = addMonthsToReferenceMonth(REFERENCE_MONTH, 2);

    configureTestBed({
      incomes: [
        income({ id: 'inc-1', incomeDate: `${REFERENCE_MONTH}-05` }),
        income({ id: 'inc-2', incomeDate: `${monthTwo}-05` }),
        income({ id: 'inc-3', incomeDate: `${monthThree}-05` }),
      ],
      expenses: [
        expense({ id: 'exp-1', dueDate: `${REFERENCE_MONTH}-10` }),
        expense({ id: 'exp-2', dueDate: `${monthTwo}-10` }),
        expense({ id: 'exp-3', dueDate: `${monthThree}-10` }),
      ],
    });

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 900,
        paymentMethod: PurchasePaymentMethod.INSTALLMENTS,
        installmentsCount: 3,
        firstChargeMonth: REFERENCE_MONTH,
      }),
    );

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      expect(output.result.monthlyImpact.map((month) => month.referenceMonth)).toEqual([
        REFERENCE_MONTH,
        monthTwo,
        monthThree,
      ]);
      expect(output.result.monthlyImpact.every((month) => month.purchaseAmount === 300)).toBe(true);
    }
  });

  it('permite escolher um mês futuro para a primeira cobrança', async () => {
    const futureMonth = addMonthsToReferenceMonth(REFERENCE_MONTH, 2);

    configureTestBed({
      incomes: [income({ incomeDate: `${futureMonth}-05` })],
      expenses: [expense({ dueDate: `${futureMonth}-10` })],
    });

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 300,
        paymentMethod: PurchasePaymentMethod.CASH,
        installmentsCount: 1,
        firstChargeMonth: futureMonth,
      }),
    );

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      expect(output.result.monthlyImpact[0].referenceMonth).toBe(futureMonth);
    }
  });

  it('retorna dados insuficientes quando não há renda cadastrada', async () => {
    configureTestBed({ incomes: [], expenses: [expense()] });

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 300,
        paymentMethod: PurchasePaymentMethod.CASH,
        installmentsCount: 1,
        firstChargeMonth: REFERENCE_MONTH,
      }),
    );

    expect(output.status).toBe('INSUFFICIENT_DATA');
    if (output.status === 'INSUFFICIENT_DATA') {
      expect(output.missingData.hint).toContain('renda mensal');
    }
  });

  it('retorna dados insuficientes quando não há nenhum dado cadastrado', async () => {
    configureTestBed({});

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 300,
        paymentMethod: PurchasePaymentMethod.CASH,
        installmentsCount: 1,
        firstChargeMonth: REFERENCE_MONTH,
      }),
    );

    expect(output.status).toBe('INSUFFICIENT_DATA');
  });

  it('rejeita valor de compra zero ou inválido', async () => {
    configureTestBed({ incomes: [income()] });

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 0,
        paymentMethod: PurchasePaymentMethod.CASH,
        installmentsCount: 1,
        firstChargeMonth: REFERENCE_MONTH,
      }),
    );

    expect(output.status).toBe('INSUFFICIENT_DATA');
  });

  it('identifica corretamente o mês mais apertado entre as parcelas', async () => {
    const monthTwo = addMonthsToReferenceMonth(REFERENCE_MONTH, 1);

    configureTestBed({
      incomes: [
        income({ id: 'inc-1', amount: 4800, incomeDate: `${REFERENCE_MONTH}-05` }),
        income({ id: 'inc-2', amount: 2500, incomeDate: `${monthTwo}-05` }),
      ],
      expenses: [
        expense({ id: 'exp-1', amount: 2000, dueDate: `${REFERENCE_MONTH}-10` }),
        expense({ id: 'exp-2', amount: 2000, dueDate: `${monthTwo}-10` }),
      ],
    });

    const service = TestBed.inject(PurchaseSimulationService);
    const output = await firstValueFrom(
      service.simulate({
        amount: 600,
        paymentMethod: PurchasePaymentMethod.INSTALLMENTS,
        installmentsCount: 2,
        firstChargeMonth: REFERENCE_MONTH,
      }),
    );

    expect(output.status).toBe('OK');
    if (output.status === 'OK') {
      expect(output.result.tightestMonth.referenceMonth).toBe(monthTwo);
    }
  });
});
