import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Debt, DebtStatus, DebtType, FinancialEducationTopic } from '../../../core/models';
import { CreateDebtInput, DebtService } from '../../../core/services/debt.service';
import { FinancialEducationService } from '../../../core/services/financial-education.service';
import { DEBT_STATUS_LABELS, DEBT_TYPE_LABELS } from '../../../core/utils/labels.util';
import { estimateMonthlyInterestPerThousand } from '../../../core/utils/interest.util';
import { formatDecimalBRL } from '../../../core/utils/currency.util';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { InfoExplanation } from '../../../shared/components/info-explanation/info-explanation';
import { MoneyValue } from '../../../shared/components/money-value/money-value';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { StatusBadge, StatusLevel } from '../../../shared/components/status-badge/status-badge';

const STATUS_LEVEL: Record<DebtStatus, StatusLevel> = {
  [DebtStatus.ACTIVE]: 'attention',
  [DebtStatus.NEGOTIATION]: 'risk',
  [DebtStatus.PAID]: 'ok',
  [DebtStatus.DEFAULTED]: 'urgent',
};

function isFilled(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Invariante espelhada de `ck_debts_status_balance` (backend): uma dívida
 * `PAID` exige `currentBalance === 0`; qualquer outro status exige
 * `currentBalance > 0`. Nunca inventa saldo — apenas bloqueia o envio de um
 * payload que o backend rejeitaria com 400.
 */
function statusBalanceValidator(group: AbstractControl): ValidationErrors | null {
  const status = group.get('status')?.value;
  const currentBalance = group.get('currentBalance')?.value;
  if (!isFilled(currentBalance)) {
    return null;
  }
  if (status === DebtStatus.PAID) {
    return currentBalance === 0 ? null : { paidRequiresZeroBalance: true };
  }
  return currentBalance > 0 ? null : { activeRequiresPositiveBalance: true };
}

/**
 * Invariante espelhada de `ck_debts_installments_pair`,
 * `ck_debts_remaining_le_total` e `ck_debts_status_installments`
 * (backend): `totalInstallments`/`remainingInstallments` devem ser ambos
 * nulos ou ambos preenchidos; `remaining <= total`; `PAID` exige
 * `remaining === 0`; qualquer outro status exige `remaining > 0`.
 */
function installmentsPairValidator(group: AbstractControl): ValidationErrors | null {
  const status = group.get('status')?.value;
  const total = group.get('totalInstallments')?.value;
  const remaining = group.get('remainingInstallments')?.value;
  const hasTotal = isFilled(total);
  const hasRemaining = isFilled(remaining);

  if (hasTotal !== hasRemaining) {
    return { installmentsPairMismatch: true };
  }
  if (!hasTotal) {
    return null;
  }
  if (remaining > total) {
    return { remainingExceedsTotal: true };
  }
  if (status === DebtStatus.PAID) {
    return remaining === 0 ? null : { paidRequiresZeroRemaining: true };
  }
  return remaining > 0 ? null : { activeRequiresPositiveRemaining: true };
}

/**
 * Cadastro de dívidas do usuário. A taxa de juros e o pagamento mínimo são
 * opcionais: o Prumo nunca inventa uma taxa que o usuário não saiba
 * informar, e só explica o custo aproximado quando o dado existe.
 */
@Component({
  selector: 'app-debts-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeader,
    EmptyState,
    MoneyValue,
    StatusBadge,
    InfoExplanation,
  ],
  templateUrl: './debts-page.html',
  styleUrl: './debts-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebtsPage {
  private readonly debtService = inject(DebtService);
  private readonly financialEducationService = inject(FinancialEducationService);
  private readonly dialog = inject(MatDialog);
  private readonly formBuilder = inject(FormBuilder);

  readonly debtTypes = Object.values(DebtType);
  readonly debtStatuses = Object.values(DebtStatus);
  readonly debtTypeLabels = DEBT_TYPE_LABELS;
  readonly debtStatusLabels = DEBT_STATUS_LABELS;

  readonly debts = signal<Debt[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group(
    {
      creditor: ['', Validators.required],
      description: ['', Validators.required],
      type: [DebtType.PERSONAL_LOAN, Validators.required],
      originalAmount: [0, [Validators.required, Validators.min(0.01)]],
      currentBalance: [0, [Validators.required, Validators.min(0)]],
      interestRateMonthly: this.formBuilder.control<number | null>(null, Validators.min(0)),
      minimumPayment: this.formBuilder.control<number | null>(null, Validators.min(0.01)),
      installmentAmount: this.formBuilder.control<number | null>(null, Validators.min(0.01)),
      totalInstallments: this.formBuilder.control<number | null>(null, Validators.min(1)),
      remainingInstallments: this.formBuilder.control<number | null>(null, Validators.min(0)),
      dueDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      startDate: ['', Validators.required],
      status: [DebtStatus.ACTIVE, Validators.required],
    },
    { validators: [statusBalanceValidator, installmentsPairValidator] },
  );

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly monthlyInterestPerThousand = computed(() => {
    const rate = this.formValue().interestRateMonthly;
    return rate ? estimateMonthlyInterestPerThousand(rate) : null;
  });

  readonly interestRateTopic = signal<FinancialEducationTopic | null>(null);
  readonly outstandingBalanceTopic = signal<FinancialEducationTopic | null>(null);

  constructor() {
    this.reload();
    this.financialEducationService.getBySlug('juros-ao-mes').subscribe((topic) => this.interestRateTopic.set(topic ?? null));
    this.financialEducationService
      .getBySlug('saldo-devedor')
      .subscribe((topic) => this.outstandingBalanceTopic.set(topic ?? null));

    this.form.controls.status.valueChanges.subscribe((status) => this.handleStatusChange(status));
  }

  /**
   * Ao selecionar `PAID`, força `currentBalance = 0` (única forma
   * compatível com `ck_debts_status_balance`) e, se o par de parcelas já
   * existir, zera `remainingInstallments`. Nunca inventa valores ao sair de
   * `PAID`: o formulário simplesmente fica inválido até o usuário informar
   * um saldo/parcela restante coerente com o novo status.
   */
  private handleStatusChange(status: DebtStatus): void {
    if (status !== DebtStatus.PAID) {
      return;
    }
    this.form.controls.currentBalance.setValue(0);
    const total = this.form.controls.totalInstallments.value;
    const remaining = this.form.controls.remainingInstallments.value;
    if (isFilled(total) && isFilled(remaining)) {
      this.form.controls.remainingInstallments.setValue(0);
    }
  }

  statusLevel(status: DebtStatus): StatusLevel {
    return STATUS_LEVEL[status];
  }

  formatDecimal(value: number): string {
    return formatDecimalBRL(value);
  }

  interestExplanation(debt: Debt): string | null {
    if (!debt.interestRateMonthly) {
      return null;
    }
    const perThousand = estimateMonthlyInterestPerThousand(debt.interestRateMonthly);
    return `${debt.interestRateMonthly}% ao mês significa cerca de R$ ${formatDecimalBRL(
      perThousand,
    )} de juros em um mês para cada R$ 1.000 ainda devidos, antes de considerar pagamentos e outras cobranças. É uma aproximação.`;
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      creditor: '',
      description: '',
      type: DebtType.PERSONAL_LOAN,
      originalAmount: 0,
      currentBalance: 0,
      interestRateMonthly: null,
      minimumPayment: null,
      installmentAmount: null,
      totalInstallments: null,
      remainingInstallments: null,
      dueDay: 1,
      startDate: '',
      status: DebtStatus.ACTIVE,
    });
    this.showForm.set(true);
  }

  startEdit(debt: Debt): void {
    this.editingId.set(debt.id);
    this.form.reset({
      creditor: debt.creditor,
      description: debt.description,
      type: debt.type,
      originalAmount: debt.originalAmount,
      currentBalance: debt.currentBalance,
      interestRateMonthly: debt.interestRateMonthly ?? null,
      minimumPayment: debt.minimumPayment ?? null,
      installmentAmount: debt.installmentAmount ?? null,
      totalInstallments: debt.totalInstallments ?? null,
      remainingInstallments: debt.remainingInstallments ?? null,
      dueDay: debt.dueDay,
      startDate: debt.startDate,
      status: debt.status,
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
    const input: CreateDebtInput = {
      creditor: value.creditor,
      description: value.description,
      type: value.type,
      originalAmount: value.originalAmount,
      currentBalance: value.currentBalance,
      interestRateMonthly: value.interestRateMonthly ?? undefined,
      minimumPayment: value.minimumPayment ?? undefined,
      installmentAmount: value.installmentAmount ?? undefined,
      totalInstallments: value.totalInstallments ?? undefined,
      remainingInstallments: value.remainingInstallments ?? undefined,
      dueDay: value.dueDay,
      startDate: value.startDate,
      status: value.status,
    };

    if (editingId) {
      this.debtService.update(editingId, input).subscribe(() => this.finishSave());
      return;
    }

    this.debtService.create(input).subscribe(() => this.finishSave());
  }

  remove(debt: Debt): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Excluir dívida',
        message: `Quer mesmo excluir a dívida com "${debt.creditor}"? Essa ação não pode ser desfeita.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.debtService.remove(debt.id).subscribe(() => this.reload());
      }
    });
  }

  private finishSave(): void {
    this.cancelForm();
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.debtService.getAll().subscribe({
      next: (debts) => {
        this.debts.set(debts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

