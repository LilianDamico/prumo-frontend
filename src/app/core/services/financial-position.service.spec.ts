import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import {
  Account,
  AccountType,
  Category,
  CategoryType,
  Debt,
  DebtStatus,
  DebtType,
  Expense,
  ExpenseStatus,
  FinancialPositionStatus,
  Income,
} from '../models';
import { currentReferenceMonth } from '../utils/date.util';
import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { DebtService } from './debt.service';
import { ExpenseService } from './expense.service';
import { FinancialPositionService } from './financial-position.service';
import { IncomeService } from './income.service';

const REFERENCE_MONTH = currentReferenceMonth();

const ESSENTIAL_CATEGORY: Category = {
  id: 'moradia',
  name: 'Moradia',
  type: CategoryType.EXPENSE,
  active: true,
  essential: true,
};

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    name: 'Conta corrente',
    institution: 'Banco',
    type: AccountType.CHECKING,
    currentBalance: 1000,
    active: true,
    ...overrides,
  };
}

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    accountId: 'acc-1',
    description: 'Aluguel',
    amount: 500,
    dueDate: `${REFERENCE_MONTH}-10`,
    categoryId: ESSENTIAL_CATEGORY.id,
    recurring: true,
    status: ExpenseStatus.PENDING,
    ...overrides,
  };
}

function income(overrides: Partial<Income> = {}): Income {
  return {
    id: 'inc-1',
    accountId: 'acc-1',
    description: 'Salário',
    amount: 2000,
    incomeDate: `${REFERENCE_MONTH}-05`,
    categoryId: 'salario',
    recurring: true,
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
  accounts?: Account[];
  expenses?: Expense[];
  incomes?: Income[];
  debts?: Debt[];
  categories?: Category[];
}): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: AccountService, useValue: { getAll: () => of(fixtures.accounts ?? []) } },
      { provide: ExpenseService, useValue: { getAll: () => of(fixtures.expenses ?? []) } },
      { provide: IncomeService, useValue: { getAll: () => of(fixtures.incomes ?? []) } },
      { provide: DebtService, useValue: { getAll: () => of(fixtures.debts ?? []) } },
      { provide: CategoryService, useValue: { getAll: () => of(fixtures.categories ?? [ESSENTIAL_CATEGORY]) } },
      { provide: BudgetService, useValue: { getByMonth: () => of(undefined) } },
    ],
  });
}

describe('FinancialPositionService', () => {
  it('calcula "quanto você pode usar" descontando pendências e parcelas obrigatórias', async () => {
    configureTestBed({
      accounts: [account({ currentBalance: 2000 })],
      expenses: [expense({ amount: 300, status: ExpenseStatus.PENDING })],
      debts: [debt({ installmentAmount: 200 })],
    });

    const service = TestBed.inject(FinancialPositionService);
    const position = await firstValueFrom(service.getPosition(REFERENCE_MONTH));
    expect(position.availableAmount).toBe(2000 - 300 - 200);
  });

  it('retorna URGENTE quando há despesa essencial atrasada', async () => {
    configureTestBed({
      accounts: [account()],
      expenses: [expense({ status: ExpenseStatus.OVERDUE, categoryId: ESSENTIAL_CATEGORY.id })],
      incomes: [income()],
    });

    const service = TestBed.inject(FinancialPositionService);
    const position = await firstValueFrom(service.getPosition(REFERENCE_MONTH));
    expect(position.status).toBe(FinancialPositionStatus.URGENTE);
  });

  it('retorna APERTO quando as despesas do mês superam a renda', async () => {
    configureTestBed({
      accounts: [account({ currentBalance: 5000 })],
      expenses: [expense({ amount: 3000, status: ExpenseStatus.PAID })],
      incomes: [income({ amount: 1000 })],
    });

    const service = TestBed.inject(FinancialPositionService);
    const position = await firstValueFrom(service.getPosition(REFERENCE_MONTH));
    expect(position.status).toBe(FinancialPositionStatus.APERTO);
  });

  it('retorna NO_PRUMO quando sobra bastante em relação à renda', async () => {
    configureTestBed({
      accounts: [account({ currentBalance: 5000 })],
      expenses: [expense({ amount: 100, status: ExpenseStatus.PENDING })],
      incomes: [income({ amount: 2000 })],
    });

    const service = TestBed.inject(FinancialPositionService);
    const position = await firstValueFrom(service.getPosition(REFERENCE_MONTH));
    expect(position.status).toBe(FinancialPositionStatus.NO_PRUMO);
  });
});
