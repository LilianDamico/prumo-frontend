import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export type SummaryCardTone = 'neutral' | 'positive' | 'attention' | 'critical';

/**
 * Card usado no painel para resumir um número importante (ex.: "Entrou",
 * "Saiu", "Quanto você pode usar"). O valor e a descrição são projetados
 * para permitir o uso de MoneyValue ou texto livre.
 */
@Component({
  selector: 'app-summary-card',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './summary-card.html',
  styleUrl: './summary-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCard {
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly tone = input<SummaryCardTone>('neutral');
  readonly highlighted = input(false);
}
