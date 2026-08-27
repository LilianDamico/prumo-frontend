import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Debt, DebtPayoffStrategyType, FinancialEducationTopic, PayoffPlanOutput, PayoffSimulation } from '../../../core/models';
import { DebtService } from '../../../core/services/debt.service';
import { FinancialEducationService } from '../../../core/services/financial-education.service';
import { PayoffPlanService } from '../../../core/services/payoff-plan.service';
import { formatReferenceMonthLabel } from '../../../core/utils/date.util';
import { ActionSuggestion } from '../../../shared/components/action-suggestion/action-suggestion';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { InfoExplanation } from '../../../shared/components/info-explanation/info-explanation';
import { MoneyValue } from '../../../shared/components/money-value/money-value';
import { PageHeader } from '../../../shared/components/page-header/page-header';

/** Slug em "Me explica" para cada estratégia de quitação, usado na explicação contextual. */
const STRATEGY_TOPIC_SLUG: Record<DebtPayoffStrategyType, string> = {
  [DebtPayoffStrategyType.AVALANCHE]: 'dividas-mais-caras-primeiro',
  [DebtPayoffStrategyType.SNOWBALL]: 'menores-dividas-primeiro',
};

/**
 * "Meu Caminho": compara as estratégias de quitação de dívidas (avalanche e
 * snowball) em linguagem simples, sem decidir pelo usuário. Todo o cálculo
 * (ordenação, tempo estimado, estimativa de juros) fica em
 * `PayoffPlanService`; este componente só exibe o resultado. A explicação de
 * cada estratégia vem de `FinancialEducationService` (fonte única de
 * conteúdo), evitando duplicar o texto aqui.
 */
@Component({
  selector: 'app-payoff-plan-page',
  imports: [RouterLink, PageHeader, MoneyValue, EmptyState, ActionSuggestion, InfoExplanation],
  templateUrl: './payoff-plan-page.html',
  styleUrl: './payoff-plan-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayoffPlanPage {
  private readonly payoffPlanService = inject(PayoffPlanService);
  private readonly debtService = inject(DebtService);
  private readonly financialEducationService = inject(FinancialEducationService);

  readonly output = signal<PayoffPlanOutput | null>(null);
  readonly debtsById = signal<Map<string, Debt>>(new Map());
  readonly strategyTopicsByType = signal<Map<DebtPayoffStrategyType, FinancialEducationTopic>>(new Map());

  constructor() {
    this.payoffPlanService.getPlan().subscribe((output) => this.output.set(output));
    this.debtService.getAll().subscribe((debts) => this.debtsById.set(new Map(debts.map((debt) => [debt.id, debt]))));

    for (const [strategyType, slug] of Object.entries(STRATEGY_TOPIC_SLUG) as [DebtPayoffStrategyType, string][]) {
      this.financialEducationService.getBySlug(slug).subscribe((topic) => {
        if (!topic) {
          return;
        }
        const next = new Map(this.strategyTopicsByType());
        next.set(strategyType, topic);
        this.strategyTopicsByType.set(next);
      });
    }
  }

  strategyTopic(strategy: DebtPayoffStrategyType): FinancialEducationTopic | undefined {
    return this.strategyTopicsByType().get(strategy);
  }

  debtLabel(debtId: string): string {
    const debt = this.debtsById().get(debtId);
    return debt ? `${debt.creditor} — ${debt.description}` : debtId;
  }

  monthLabel(referenceMonth: string | undefined): string | undefined {
    return referenceMonth ? formatReferenceMonthLabel(referenceMonth) : undefined;
  }

  timeEstimateLabel(simulation: PayoffSimulation): string {
    const months = simulation.estimatedMonthsToPayoff;
    if (months === undefined) {
      return 'Ainda não temos dados suficientes para estimar o tempo.';
    }
    if (months <= 1) {
      return 'Cerca de 1 mês, no ritmo atual.';
    }
    if (months < 12) {
      return `Cerca de ${months} meses, no ritmo atual.`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const yearsLabel = `${years} ${years === 1 ? 'ano' : 'anos'}`;
    const monthsLabel = remainingMonths > 0 ? ` e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}` : '';
    return `Cerca de ${yearsLabel}${monthsLabel}, no ritmo atual.`;
  }
}
