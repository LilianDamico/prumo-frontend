import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/**
 * Explicação curta de um conceito financeiro, reutilizada dentro de outras
 * telas (ex.: campo de juros) e na área "Me explica". Quando `learnMoreSlug`
 * é informado, mostra um link "Entender melhor" para o conteúdo completo em
 * "Me explica" (fonte única: `FinancialEducationService`).
 */
@Component({
  selector: 'app-info-explanation',
  imports: [MatIconModule, RouterLink],
  templateUrl: './info-explanation.html',
  styleUrl: './info-explanation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoExplanation {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly example = input<string>();
  readonly whyItMatters = input<string>();
  /** Slug do conceito em "Me explica", para o link opcional "Entender melhor". */
  readonly learnMoreSlug = input<string>();
}
