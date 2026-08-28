import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { DebtStatus, Expense, ExpenseStatus, FinancialPositionStatus } from '../../../core/models';
import { DebtService } from '../../../core/services/debt.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { FinancialPositionService } from '../../../core/services/financial-position.service';
import { formatIsoDateAsBr } from '../../../core/utils/date.util';
import { ActionSuggestion } from '../../../shared/components/action-suggestion/action-suggestion';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { MoneyValue } from '../../../shared/components/money-value/money-value';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { StatusBadge, StatusLevel } from '../../../shared/components/status-badge/status-badge';
import { SummaryCard } from '../../../shared/components/summary-card/summary-card';

const STATUS_LEVEL: Record<FinancialPositionStatus, StatusLevel> = {
  [FinancialPositionStatus.NO_PRUMO]: 'ok',
  [FinancialPositionStatus.ATENCAO]: 'attention',
  [FinancialPositionStatus.APERTO]: 'risk',
  [FinancialPositionStatus.URGENTE]: 'urgent',
};

const STATUS_LABEL: Record<FinancialPositionStatus, string> = {
  [FinancialPositionStatus.NO_PRUMO]: 'No Prumo',
  [FinancialPositionStatus.ATENCAO]: 'Atenção',
  [FinancialPositionStatus.APERTO]: 'Aperto',
  [FinancialPositionStatus.URGENTE]: 'Urgente',
};

const STATUS_EXPLANATION: Record<FinancialPositionStatus, string> = {
  [FinancialPositionStatus.NO_PRUMO]: 'Suas contas estão equilibradas.',
  [FinancialPositionStatus.ATENCAO]: 'Seu orçamento está apertado.',
  [FinancialPositionStatus.APERTO]: 'Suas despesas estão maiores que sua renda.',
  [FinancialPositionStatus.URGENTE]: 'Há contas essenciais ou dívidas em risco de atraso.',
};

interface UpcomingExpenseView {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly dueDate: string;
  readonly overdue: boolean;
}

/**
 * Painel principal do Prumo: responde, de forma simples, quanto entrou,
 * quanto saiu, quanto ainda falta pagar e quanto o usuário realmente pode
 * usar. Toda a regra de cálculo vive no `FinancialPositionService` — este
 * componente só monta a visualização.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [PageHeader, SummaryCard, MoneyValue, StatusBadge, EmptyState, ActionSuggestion],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly financialPositionService = inject(FinancialPositionService);
  private readonly expenseService = inject(ExpenseService);
  private readonly debtService = inject(DebtService);

  /** Exposto ao template para exibir `dueDate` sem risco de deslocamento por timezone. */
  protected readonly formatIsoDateAsBr = formatIsoDateAsBr;

  protected readonly position = toSignal(this.financialPositionService.getPosition());

  protected readonly statusLevel = computed<StatusLevel>(() => {
    const position = this.position();
    return position ? STATUS_LEVEL[position.status] : 'ok';
  });

  protected readonly statusLabel = computed(() => {
    const position = this.position();
    return position ? STATUS_LABEL[position.status] : '';
  });

  protected readonly statusExplanation = computed(() => {
    const position = this.position();
    return position ? STATUS_EXPLANATION[position.status] : '';
  });

  protected readonly totalDebtBalance = toSignal(
    this.debtService.getAll().pipe(
      map((debts) =>
        debts
          .filter((debt) => debt.status !== DebtStatus.PAID)
          .reduce((total, debt) => total + debt.currentBalance, 0),
      ),
    ),
    { initialValue: 0 },
  );

  protected readonly upcomingExpenses = toSignal(
    this.expenseService.getAll().pipe(map((expenses) => this.buildUpcomingExpenses(expenses))),
    { initialValue: [] as UpcomingExpenseView[] },
  );

  protected readonly alerts = computed<string[]>(() => {
    const position = this.position();
    if (!position) {
      return [];
    }

    const messages: string[] = [];
    const overdue = this.upcomingExpenses().filter((expense) => expense.overdue);
    if (overdue.length === 1) {
      messages.push(`A conta "${overdue[0].description}" está atrasada.`);
    } else if (overdue.length > 1) {
      messages.push(`Você tem ${overdue.length} contas atrasadas.`);
    }
    if (position.availableAmount < 0) {
      messages.push('O valor que sobra este mês já ficou negativo. Vale rever os próximos gastos.');
    }
    return messages;
  });

  private buildUpcomingExpenses(expenses: Expense[]): UpcomingExpenseView[] {
    return expenses
      .filter((expense) => expense.status === ExpenseStatus.PENDING || expense.status === ExpenseStatus.OVERDUE)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
      .map((expense) => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        dueDate: expense.dueDate,
        overdue: expense.status === ExpenseStatus.OVERDUE,
      }));
  }
}
