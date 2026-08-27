import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Sugestão de ação útil e não intrusiva (ex.: seção "O que merece sua
 * atenção" no painel). Aceita um link ou botão projetado como ação.
 */
@Component({
  selector: 'app-action-suggestion',
  imports: [MatIconModule],
  templateUrl: './action-suggestion.html',
  styleUrl: './action-suggestion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionSuggestion {
  readonly message = input.required<string>();
  readonly icon = input('lightbulb');
}
