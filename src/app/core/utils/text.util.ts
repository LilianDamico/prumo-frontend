/**
 * Normaliza texto para comparação/busca: minúsculas e sem acentos (ex.:
 * "Amortização" e "amortizacao" ficam iguais). Usado por
 * `FinancialEducationService` para permitir buscas humanas, sem exigir que
 * o usuário digite acentuação correta.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
