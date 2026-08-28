import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { formatIsoDateAsBr } from '../../../core/utils/date.util';
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

  /** Exposto ao template para exibir `dueDate`/`paymentDate` sem risco de deslocamento por timezone. */
  readonly formatIsoDateAsBr = formatIsoDateAsBr;

  readonly statuses = Object.values(ExpenseStatus);
  readonly statusLabels = EXPENSE_STATUS_LABELS;

  readonly expenses = signal<Expense[]>([]);
  readonly expensesLoading = signal(true);

  readonly accounts = signal<Account[]>([]);
  readonly accountsLoaded = signal(false);

  readonly categories = signal<Category[]>([]);
  readonly categoriesLoaded = signal(false);

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  /** Conta/categoria da despesa em edição, preservadas mesmo se inativas. */
  private readonly editingAccountId = signal<string | null>(null);
  private readonly editingCategoryId = signal<string | null>(null);

  /**
   * Dependências necessárias para operar o formulário (contas e categorias
   * de despesa). Enquanto carregam, o formulário não deve ser exibido como
   * operacional — evita abrir com selects vazios por corrida assíncrona.
   */
  readonly dependenciesLoading = computed(() => !this.accountsLoaded() || !this.categoriesLoaded());

  /** Contas ativas, mais a conta da despesa em edição, mesmo que inativa. */
  readonly selectableAccounts = computed(() => {
    const editingAccountId = this.editingAccountId();
    return this.accounts().filter((account) => account.active || account.id === editingAccountId);
  });

  /** Categorias de despesa ativas, mais a categoria da despesa em edição, mesmo que inativa. */
  readonly selectableCategories = computed(() => {
    const editingCategoryId = this.editingCategoryId();
    return this.categories().filter((category) => category.active || category.id === editingCategoryId);
  });

  readonly hasActiveAccounts = computed(() => this.accounts().some((account) => account.active));
  readonly hasActiveCategories = computed(() => this.categories().some((category) => category.active));

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
    this.categoryService.getByType(CategoryType.EXPENSE).subscribe((categories) => {
      this.categories.set(categories);
      this.categoriesLoaded.set(true);
    });
    this.accountService.getAll().subscribe((accounts) => {
      this.accounts.set(accounts);
      this.accountsLoaded.set(true);
    });

    // Mantém a coerência status × paymentDate exigida pelo backend também
    // na UI: PAID exige paymentDate habilitada e obrigatória; qualquer
    // outro status limpa e desabilita o campo.
    this.form.controls.status.valueChanges.subscribe((status) => this.syncPaymentDateControl(status));
    this.syncPaymentDateControl(this.form.controls.status.value);
  }

  statusLevel(status: ExpenseStatus): StatusLevel {
    return STATUS_LEVEL[status];
  }

  startCreate(): void {
    if (this.dependenciesLoading()) {
      return;
    }
    this.editingId.set(null);
    this.editingAccountId.set(null);
    this.editingCategoryId.set(null);
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
    this.syncPaymentDateControl(ExpenseStatus.PENDING);
    this.showForm.set(true);
  }

  startEdit(expense: Expense): void {
    this.editingId.set(expense.id);
    this.editingAccountId.set(expense.accountId);
    this.editingCategoryId.set(expense.categoryId);
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
    this.syncPaymentDateControl(expense.status);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.editingAccountId.set(null);
    this.editingCategoryId.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Nunca depender apenas de `form.value`/`getRawValue()` para o campo
    // `paymentDate`: reforça explicitamente a regra do backend
    // (status === PAID -> paymentDate obrigatória; caso contrário, null).
    const value = this.form.getRawValue();
    const status = value.status;
    const paymentDate = status === ExpenseStatus.PAID ? value.paymentDate || null : null;
    const editingId = this.editingId();
    const input: CreateExpenseInput = {
      description: value.description,
      amount: value.amount,
      dueDate: value.dueDate,
      paymentDate,
      categoryId: value.categoryId,
      accountId: value.accountId,
      recurring: value.recurring,
      status,
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

  /**
   * Habilita/exige `paymentDate` apenas quando `status === PAID`; para
   * qualquer outro status, limpa e desabilita o controle (não é enviada no
   * `form.value`, mas o payload em `save()` já força `null` explicitamente).
   */
  private syncPaymentDateControl(status: ExpenseStatus): void {
    const control = this.form.controls.paymentDate;
    if (status === ExpenseStatus.PAID) {
      control.enable({ emitEvent: false });
      control.setValidators(Validators.required);
    } else {
      control.setValue('', { emitEvent: false });
      control.clearValidators();
      control.disable({ emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private finishSave(): void {
    this.cancelForm();
    this.reload();
  }

  private reload(): void {
    this.expensesLoading.set(true);
    this.expenseService.getAll().subscribe((expenses) => {
      this.expenses.set(expenses);
      this.expensesLoading.set(false);
    });
  }
}
