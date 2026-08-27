import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);

/**
 * Exibe um valor monetário sempre formatado em reais (padrão brasileiro).
 * Centraliza a formatação de moeda para que nenhum componente precise
 * reimplementar a lógica de exibição de valores em reais.
 */
@Component({
  selector: 'app-money-value',
  imports: [CurrencyPipe],
  templateUrl: './money-value.html',
  styleUrl: './money-value.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoneyValue {
  readonly value = input.required<number>();
  /** Quando verdadeiro, mostra o sinal de + para valores positivos. */
  readonly showSign = input(false);

  protected readonly isNegative = computed(() => this.value() < 0);
  protected readonly prefix = computed(() => (this.showSign() && this.value() > 0 ? '+' : ''));
}
