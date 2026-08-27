const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formata um número no padrão brasileiro de casas decimais (vírgula em vez
 * de ponto), sem o símbolo de moeda. Útil para textos explicativos montados
 * em TypeScript (fora do `MoneyValue`/`CurrencyPipe`), garantindo que nenhum
 * componente exiba valores como "12.50" para o usuário brasileiro.
 */
export function formatDecimalBRL(value: number): string {
  return BRL_FORMATTER.format(value);
}
