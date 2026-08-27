import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Cabeçalho padrão de página: título, subtítulo opcional e uma área
 * para ações (ex.: botão "Novo") projetada via content projection.
 */
@Component({
  selector: 'app-page-header',
  imports: [],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
