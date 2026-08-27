import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type StatusLevel = 'ok' | 'attention' | 'risk' | 'urgent';

const ICON_BY_LEVEL: Record<StatusLevel, string> = {
  ok: 'check_circle',
  attention: 'info',
  risk: 'warning',
  urgent: 'error',
};

/**
 * Mostra um estado (ex.: "No Prumo", "Atenção", "Aperto", "Urgente") sempre
 * com ícone e texto, para não depender apenas de cor.
 */
@Component({
  selector: 'app-status-badge',
  imports: [MatIconModule],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly level = input.required<StatusLevel>();
  readonly label = input.required<string>();

  protected readonly icon = computed(() => ICON_BY_LEVEL[this.level()]);
}
