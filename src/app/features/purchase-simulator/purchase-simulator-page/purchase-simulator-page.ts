import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { RouterLink } from '@angular/router';

import {
  FinancialEducationTopic,
  PurchasePaymentMethod,
  PurchaseSimulationMonthImpact,
  PurchaseSimulationOutcome,
  PurchaseSimulationOutput,
} from '../../../core/models';
import { FinancialEducationService } from '../../../core/services/financial-education.service';
import { PurchaseSimulationService } from '../../../core/services/purchase-simulation.service';
import { currentReferenceMonth, formatReferenceMonthLabel } from '../../../core/utils/date.util';
import { formatDecimalBRL } from '../../../core/utils/currency.util';
import { ActionSuggestion } from '../../../shared/components/action-suggestion/action-suggestion';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { InfoExplanation } from '../../../shared/components/info-explanation/info-explanation';
import { MoneyValue } from '../../../shared/components/money-value/money-value';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { StatusBadge, StatusLevel } from '../../../shared/components/status-badge/status-badge';

/** Quantidade máxima de parcelas oferecida no formulário (limite de interface, não regra financeira). */
export const MAX_INSTALLMENTS_OPTION = 24;

const OUTCOME_TITLE: Record<PurchaseSimulationOutcome, string> = {
  [PurchaseSimulationOutcome.CONFORTAVEL]: 'Essa compra cabe no seu orçamento atual.',
  [PurchaseSimulationOutcome.POSSIVEL_MAS_APERTA]:
    'Você consegue assumir essa compra, mas seu orçamento ficará apertado.',
  [PurchaseSimulationOutcome.ALTO_RISCO]:
    'Essa compra pode fazer faltar dinheiro para contas que você já assumiu.',
};

const OUTCOME_LEVEL: Record<PurchaseSimulationOutcome, StatusLevel> = {
  [PurchaseSimulationOutcome.CONFORTAVEL]: 'ok',
  [PurchaseSimulationOutcome.POSSIVEL_MAS_APERTA]: 'attention',
  [PurchaseSimulationOutcome.ALTO_RISCO]: 'urgent',
};

const OUTCOME_LABEL: Record<PurchaseSimulationOutcome, string> = {
  [PurchaseSimulationOutcome.CONFORTAVEL]: 'Confortável',
  [PurchaseSimulationOutcome.POSSIVEL_MAS_APERTA]: 'Aperta o orçamento',
  [PurchaseSimulationOutcome.ALTO_RISCO]: 'Alto risco',
};

/**
 * Simulador "Posso comprar?": mostra o impacto de uma compra pretendida nas
 * finanças do usuário, mês a mês, sem nunca decidir por ele ("sim"/"não").
 * Toda a regra de cálculo fica em `PurchaseSimulationService`; este
 * componente só exibe o resultado.
 */
@Component({
  selector: 'app-purchase-simulator-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    PageHeader,
    MoneyValue,
    StatusBadge,
    EmptyState,
    InfoExplanation,
    ActionSuggestion,
  ],
  templateUrl: './purchase-simulator-page.html',
  styleUrl: './purchase-simulator-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseSimulatorPage {
  private readonly simulationService = inject(PurchaseSimulationService);
  private readonly financialEducationService = inject(FinancialEducationService);
  private readonly formBuilder = inject(FormBuilder);

  readonly paymentMethods = PurchasePaymentMethod;
  readonly installmentOptions = Array.from({ length: MAX_INSTALLMENTS_OPTION - 1 }, (_, index) => index + 2);
  readonly maxInstallments = MAX_INSTALLMENTS_OPTION;

  readonly form = this.formBuilder.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: [PurchasePaymentMethod.CASH, Validators.required],
    installmentsCount: [2, [Validators.min(2), Validators.max(MAX_INSTALLMENTS_OPTION)]],
    firstChargeMonth: [currentReferenceMonth(), Validators.required],
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly isInstallments = computed(() => this.formValue().paymentMethod === PurchasePaymentMethod.INSTALLMENTS);

  readonly output = signal<PurchaseSimulationOutput | null>(null);
  readonly submitted = signal(false);
  readonly availableAmountTopic = signal<FinancialEducationTopic | null>(null);

  constructor() {
    this.financialEducationService
      .getBySlug('valor-realmente-disponivel')
      .subscribe((topic) => this.availableAmountTopic.set(topic ?? null));
  }

  simulate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.set(true);
    this.simulationService
      .simulate({
        amount: value.amount,
        paymentMethod: value.paymentMethod,
        installmentsCount: value.installmentsCount,
        firstChargeMonth: value.firstChargeMonth,
      })
      .subscribe((output) => this.output.set(output));
  }

  reset(): void {
    this.submitted.set(false);
    this.output.set(null);
    this.form.reset({
      amount: 0,
      paymentMethod: PurchasePaymentMethod.CASH,
      installmentsCount: 2,
      firstChargeMonth: currentReferenceMonth(),
    });
  }

  outcomeTitle(outcome: PurchaseSimulationOutcome): string {
    return OUTCOME_TITLE[outcome];
  }

  outcomeLevel(outcome: PurchaseSimulationOutcome): StatusLevel {
    return OUTCOME_LEVEL[outcome];
  }

  outcomeLabel(outcome: PurchaseSimulationOutcome): string {
    return OUTCOME_LABEL[outcome];
  }

  outcomeSummary(outcome: PurchaseSimulationOutcome, tightestMonth: PurchaseSimulationMonthImpact): string {
    const remaining = tightestMonth.projectedAvailableAfterPurchase;
    const monthLabel = formatReferenceMonthLabel(tightestMonth.referenceMonth);

    if (outcome === PurchaseSimulationOutcome.ALTO_RISCO) {
      return `No mês mais apertado (${monthLabel}), podem faltar aproximadamente R$ ${formatDecimalBRL(
        Math.abs(remaining),
      )}.`;
    }
    return `No mês mais apertado (${monthLabel}), ${
      outcome === PurchaseSimulationOutcome.CONFORTAVEL ? 'ainda devem sobrar' : 'devem sobrar'
    } aproximadamente R$ ${formatDecimalBRL(remaining)}.`;
  }

  monthLabel(referenceMonth: string): string {
    return formatReferenceMonthLabel(referenceMonth);
  }
}
