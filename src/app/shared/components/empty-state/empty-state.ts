import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Estado vazio útil: sempre explica o que falta e sugere o próximo passo,
 * em vez de mostrar apenas "Nenhum registro encontrado".
 */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly message = input.required<string>();
  readonly hint = input<string>();
  readonly icon = input('inbox');
}
