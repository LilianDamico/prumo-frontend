import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';

import {
  Account,
  Category,
  Debt,
  DebtStatus,
  Expense,
  ExpenseStatus,
  FinancialPosition,
  FinancialPositionStatus,
  Income,
  IsoMonthString,
  MonthlyBudget,
} from '../models';
import { currentReferenceMonth, isDateInMonth } from '../utils/date.util';
import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { DebtService } from './debt.service';
import { ExpenseService } from './expense.service';
import { IncomeService } from './income.service';

/**
 * Fração da renda do mês que, se sobrar menos do que isso em "quanto você
 * pode usar", já é motivo de atenção (mesmo sem despesas maiores que a
 * renda ou contas essenciais atrasadas).
 */
const ATTENTION_THRESHOLD_RATIO = 0.15;

/**
 * Calcula a posição financeira do usuário em um mês ("quanto entrou",
 * "quanto sobra de verdade", estado geral das contas). Centraliza a regra de
 * negócio para que ela não fique espalhada nos componentes de tela.
 */
@Injectable({ providedIn: 'root' })
export class FinancialPositionService {
  private readonly accountService = inject(AccountService);
  private readonly expenseService = inject(ExpenseService);
  private readonly incomeService = inject(IncomeService);
  private readonly debtService = inject(DebtService);
  private readonly categoryService = inject(CategoryService);
  private readonly budgetService = inject(BudgetService);

  /** Posição financeira do mês informado (padrão: mês atual). */
  getPosition(referenceMonth: IsoMonthString = currentReferenceMonth()): Observable<FinancialPosition> {
    return combineLatest([
      this.accountService.getAll(),
      this.expenseService.getAll(),
      this.incomeService.getAll(),
      this.debtService.getAll(),
      this.categoryService.getAll(),
      this.budgetService.getByMonth(referenceMonth),
    ]).pipe(
      map(([accounts, expenses, incomes, debts, categories, budget]) =>
        this.calculate(referenceMonth, accounts, expenses, incomes, debts, categories, budget),
      ),
    );
  }

  private calculate(
    referenceMonth: IsoMonthString,
    accounts: Account[],
    expenses: Expense[],
    incomes: Income[],
    debts: Debt[],
    categories: Category[],
    budget: MonthlyBudget | undefined,
  ): FinancialPosition {
    const monthExpenses = expenses.filter((expense) => isDateInMonth(expense.dueDate, referenceMonth));
    const monthIncomes = incomes.filter((income) => isDateInMonth(income.incomeDate, referenceMonth));

    const totalIncome = sum(monthIncomes.map((income) => income.amount));
    const totalPaidExpenses = sum(
      monthExpenses.filter((expense) => expense.status === ExpenseStatus.PAID).map((expense) => expense.amount),
    );
    const pendingExpenses = monthExpenses.filter(
      (expense) => expense.status === ExpenseStatus.PENDING || expense.status === ExpenseStatus.OVERDUE,
    );
    const totalPendingExpenses = sum(pendingExpenses.map((expense) => expense.amount));

    const activeDebts = debts.filter((debt) => debt.status === DebtStatus.ACTIVE);
    const totalMandatoryInstallments = sum(
      activeDebts.map((debt) => debt.installmentAmount ?? debt.minimumPayment ?? 0),
    );

    const plannedReserve = budget?.emergencyReserveTarget ?? 0;
    const currentBalance = sum(
      accounts.filter((account) => account.active).map((account) => account.currentBalance),
    );

    const availableAmount = currentBalance - totalPendingExpenses - totalMandatoryInstallments - plannedReserve;

    const status = this.resolveStatus({
      totalIncome,
      totalExpenses: totalPaidExpenses + totalPendingExpenses,
      availableAmount,
      hasOverdueEssentialExpense: this.hasOverdueEssentialExpense(monthExpenses, categories),
      hasDebtAtRisk: debts.some(
        (debt) => debt.status === DebtStatus.DEFAULTED || debt.status === DebtStatus.NEGOTIATION,
      ),
    });

    return {
      referenceMonth,
      totalIncome,
      totalPaidExpenses,
      totalPendingExpenses,
      totalMandatoryInstallments,
      plannedReserve,
      availableAmount,
      status,
    };
  }

  private hasOverdueEssentialExpense(expenses: Expense[], categories: Category[]): boolean {
    const essentialCategoryIds = new Set(
      categories.filter((category) => category.essential).map((category) => category.id),
    );
    return expenses.some(
      (expense) => expense.status === ExpenseStatus.OVERDUE && essentialCategoryIds.has(expense.categoryId),
    );
  }

  private resolveStatus(input: {
    totalIncome: number;
    totalExpenses: number;
    availableAmount: number;
    hasOverdueEssentialExpense: boolean;
    hasDebtAtRisk: boolean;
  }): FinancialPositionStatus {
    const { totalIncome, totalExpenses, availableAmount, hasOverdueEssentialExpense, hasDebtAtRisk } = input;

    if (hasOverdueEssentialExpense || hasDebtAtRisk || availableAmount < 0) {
      return FinancialPositionStatus.URGENTE;
    }
    if (totalIncome > 0 && totalExpenses > totalIncome) {
      return FinancialPositionStatus.APERTO;
    }
    if (totalIncome > 0 && availableAmount < totalIncome * ATTENTION_THRESHOLD_RATIO) {
      return FinancialPositionStatus.ATENCAO;
    }
    return FinancialPositionStatus.NO_PRUMO;
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
