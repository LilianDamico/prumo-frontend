import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Account, Category, CategoryType, Income } from '../../../core/models';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { CreateIncomeInput, IncomeService } from '../../../core/services/income.service';
import { formatIsoDateAsBr } from '../../../core/utils/date.util';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { MoneyValue } from '../../../shared/components/money-value/money-value';
import { PageHeader } from '../../../shared/components/page-header/page-header';

/**
 * Cadastro de receitas (entradas de dinheiro) do usuário. Lista, cria,
 * edita e exclui, com confirmação antes de excluir.
 */
@Component({
  selector: 'app-incomes-page',
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
  ],
  templateUrl: './incomes-page.html',
  styleUrl: './incomes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomesPage {
  private readonly incomeService = inject(IncomeService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly formBuilder = inject(FormBuilder);

  /** Exposto ao template para exibir `incomeDate` sem risco de deslocamento por timezone. */
  readonly formatIsoDateAsBr = formatIsoDateAsBr;

  readonly incomes = signal<Income[]>([]);
  readonly incomesLoading = signal(true);

  readonly accounts = signal<Account[]>([]);
  readonly accountsLoaded = signal(false);

  readonly categories = signal<Category[]>([]);
  readonly categoriesLoaded = signal(false);

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  /** Conta/categoria da receita em edição, preservadas mesmo se inativas. */
  private readonly editingAccountId = signal<string | null>(null);
  private readonly editingCategoryId = signal<string | null>(null);

  /**
   * Dependências necessárias para operar o formulário (contas e categorias
   * de renda). Enquanto carregam, o formulário não deve ser exibido como
   * operacional — evita abrir com selects vazios por corrida assíncrona.
   */
  readonly dependenciesLoading = computed(() => !this.accountsLoaded() || !this.categoriesLoaded());

  /** Contas ativas, mais a conta da receita em edição, mesmo que inativa. */
  readonly selectableAccounts = computed(() => {
    const editingAccountId = this.editingAccountId();
    return this.accounts().filter((account) => account.active || account.id === editingAccountId);
  });

  /** Categorias de renda ativas, mais a categoria da receita em edição, mesmo que inativa. */
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
    incomeDate: ['', Validators.required],
    categoryId: ['', Validators.required],
    accountId: ['', Validators.required],
    recurring: [false],
  });

  constructor() {
    this.reloadIncomes();
    this.categoryService.getByType(CategoryType.INCOME).subscribe((categories) => {
      this.categories.set(categories);
      this.categoriesLoaded.set(true);
    });
    this.accountService.getAll().subscribe((accounts) => {
      this.accounts.set(accounts);
      this.accountsLoaded.set(true);
    });
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
      incomeDate: '',
      categoryId: '',
      accountId: '',
      recurring: false,
    });
    this.showForm.set(true);
  }

  startEdit(income: Income): void {
    this.editingId.set(income.id);
    this.editingAccountId.set(income.accountId);
    this.editingCategoryId.set(income.categoryId);
    this.form.reset({
      description: income.description,
      amount: income.amount,
      incomeDate: income.incomeDate,
      categoryId: income.categoryId,
      accountId: income.accountId,
      recurring: income.recurring,
    });
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

    const value = this.form.getRawValue();
    const editingId = this.editingId();
    const input: CreateIncomeInput = {
      description: value.description,
      amount: value.amount,
      incomeDate: value.incomeDate,
      categoryId: value.categoryId,
      accountId: value.accountId,
      recurring: value.recurring,
    };

    if (editingId) {
      this.incomeService.update(editingId, input).subscribe(() => this.finishSave());
      return;
    }

    this.incomeService.create(input).subscribe(() => this.finishSave());
  }

  remove(income: Income): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Excluir receita',
        message: `Quer mesmo excluir a receita "${income.description}"? Essa ação não pode ser desfeita.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.incomeService.remove(income.id).subscribe(() => this.reloadIncomes());
      }
    });
  }

  private finishSave(): void {
    this.cancelForm();
    this.reloadIncomes();
  }

  private reloadIncomes(): void {
    this.incomesLoading.set(true);
    this.incomeService.getAll().subscribe((incomes) => {
      this.incomes.set(incomes);
      this.incomesLoading.set(false);
    });
  }
}

