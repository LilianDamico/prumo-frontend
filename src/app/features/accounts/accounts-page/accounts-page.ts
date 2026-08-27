import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Account, AccountType } from '../../../core/models';
import { AccountService, CreateAccountInput } from '../../../core/services/account.service';
import { ACCOUNT_TYPE_LABELS } from '../../../core/utils/labels.util';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { MoneyValue } from '../../../shared/components/money-value/money-value';
import { PageHeader } from '../../../shared/components/page-header/page-header';

/**
 * Cadastro de contas do usuário (corrente, poupança, investimento ou
 * dinheiro). Lista, cria, edita e exclui, com confirmação antes de excluir.
 */
@Component({
  selector: 'app-accounts-page',
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
  templateUrl: './accounts-page.html',
  styleUrl: './accounts-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsPage {
  private readonly accountService = inject(AccountService);
  private readonly dialog = inject(MatDialog);
  private readonly formBuilder = inject(FormBuilder);

  readonly accountTypes = Object.values(AccountType);
  readonly accountTypeLabels = ACCOUNT_TYPE_LABELS;

  readonly accounts = signal<Account[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    institution: ['', Validators.required],
    type: [AccountType.CHECKING, Validators.required],
    currentBalance: [0, Validators.required],
    active: [true],
  });

  constructor() {
    this.reload();
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      institution: '',
      type: AccountType.CHECKING,
      currentBalance: 0,
      active: true,
    });
    this.showForm.set(true);
  }

  startEdit(account: Account): void {
    this.editingId.set(account.id);
    this.form.reset({
      name: account.name,
      institution: account.institution ?? '',
      type: account.type,
      currentBalance: account.currentBalance,
      active: account.active,
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

    if (editingId) {
      this.accountService
        .update(editingId, {
          name: value.name,
          institution: value.institution,
          type: value.type,
          currentBalance: value.currentBalance,
          active: value.active,
        })
        .subscribe(() => this.finishSave());
      return;
    }

    const input: CreateAccountInput = {
      name: value.name,
      institution: value.institution,
      type: value.type,
      currentBalance: value.currentBalance,
      active: value.active,
    };
    this.accountService.create(input).subscribe(() => this.finishSave());
  }

  remove(account: Account): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Excluir conta',
        message: `Quer mesmo excluir a conta "${account.name}"? Essa ação não pode ser desfeita.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.accountService.remove(account.id).subscribe(() => this.reload());
      }
    });
  }

  private finishSave(): void {
    this.cancelForm();
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.accountService.getAll().subscribe((accounts) => {
      this.accounts.set(accounts);
      this.loading.set(false);
    });
  }
}

