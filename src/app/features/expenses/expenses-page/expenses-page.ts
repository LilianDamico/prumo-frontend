import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Account, CategoryType, Category, Expense, ExpenseStatus } from '../../../core/models';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { CreateExpenseInput, ExpenseService } from '../../../core/services/expense.service';
import { EXPENSE_STATUS_LABELS } from '../../../core/utils/labels.util';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { MoneyValue } from '../../../shared/components/money-value/money-value';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { StatusBadge, StatusLevel } from '../../../shared/components/status-badge/status-badge';

const STATUS_LEVEL: Record<ExpenseStatus, StatusLevel> = {
  [ExpenseStatus.PENDING]: 'attention',
  [ExpenseStatus.PAID]: 'ok',
  [ExpenseStatus.OVERDUE]: 'urgent',
  [ExpenseStatus.CANCELLED]: 'ok',
};

/**
 * Cadastro de despesas (contas a pagar) do usuário. Lista, cria, edita e
 * exclui, com confirmação antes de excluir.
 */
@Component({
  selector: 'app-expenses-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    PageHeader,
    EmptyState,
    MoneyValue,
    StatusBadge,
  ],
  templateUrl: './expenses-page.html',
  styleUrl: './expenses-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesPage {
  private readonly expenseService = inject(ExpenseService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly formBuilder = inject(FormBuilder);

  readonly statuses = Object.values(ExpenseStatus);
  readonly statusLabels = EXPENSE_STATUS_LABELS;

  readonly expenses = signal<Expense[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly accountNameById = computed(
    () => new Map(this.accounts().map((account) => [account.id, account.name])),
  );
  readonly categoryNameById = computed(
    () => new Map(this.categories().map((category) => [category.id, category.name])),
  );

  readonly form = this.formBuilder.nonNullable.group({
    description: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    dueDate: ['', Validators.required],
    paymentDate: [''],
    categoryId: ['', Validators.required],
    accountId: ['', Validators.required],
    recurring: [false],
    status: [ExpenseStatus.PENDING, Validators.required],
  });

  constructor() {
    this.reload();
    this.categoryService
      .getByType(CategoryType.EXPENSE)
      .subscribe((categories) => this.categories.set(categories));
    this.accountService.getAll().subscribe((accounts) => this.accounts.set(accounts));
  }

  statusLevel(status: ExpenseStatus): StatusLevel {
    return STATUS_LEVEL[status];
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      description: '',
      amount: 0,
      dueDate: '',
      paymentDate: '',
      categoryId: '',
      accountId: '',
      recurring: false,
      status: ExpenseStatus.PENDING,
    });
    this.showForm.set(true);
  }

  startEdit(expense: Expense): void {
    this.editingId.set(expense.id);
    this.form.reset({
      description: expense.description,
      amount: expense.amount,
      dueDate: expense.dueDate,
      paymentDate: expense.paymentDate ?? '',
      categoryId: expense.categoryId,
      accountId: expense.accountId,
      recurring: expense.recurring,
      status: expense.status,
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const editingId = this.editingId();
    const input: CreateExpenseInput = {
      description: value.description,
      amount: value.amount,
      dueDate: value.dueDate,
      paymentDate: value.paymentDate ? value.paymentDate : undefined,
      categoryId: value.categoryId,
      accountId: value.accountId,
      recurring: value.recurring,
      status: value.status,
    };

    if (editingId) {
      this.expenseService.update(editingId, input).subscribe(() => this.finishSave());
      return;
    }

    this.expenseService.create(input).subscribe(() => this.finishSave());
  }

  remove(expense: Expense): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Excluir despesa',
        message: `Quer mesmo excluir a despesa "${expense.description}"? Essa ação não pode ser desfeita.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.expenseService.remove(expense.id).subscribe(() => this.reload());
      }
    });
  }

  private finishSave(): void {
    this.cancelForm();
    this.reload();
  }

  private reload(): void {
    this.expenseService.getAll().subscribe((expenses) => this.expenses.set(expenses));
  }
}

