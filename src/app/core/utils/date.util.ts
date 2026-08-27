import { IsoMonthString } from '../models';

/**
 * Mês de referência atual no formato `AAAA-MM`, usado como padrão pelo
 * `FinancialPositionService` e por telas que resumem "o mês atual".
 */
export function currentReferenceMonth(): IsoMonthString {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

/** Verifica se uma data ISO (`AAAA-MM-DD`) pertence ao mês de referência informado. */
export function isDateInMonth(isoDate: string, referenceMonth: IsoMonthString): boolean {
  return isoDate.startsWith(referenceMonth);
}

/** Soma (ou subtrai, com `monthsToAdd` negativo) meses a um mês de referência `AAAA-MM`. */
export function addMonthsToReferenceMonth(referenceMonth: IsoMonthString, monthsToAdd: number): IsoMonthString {
  const [year, month] = referenceMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + monthsToAdd, 1);
  const resultMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${resultMonth}`;
}

/** Formata um mês de referência `AAAA-MM` como texto simples (ex.: "outubro de 2026"). */
export function formatReferenceMonthLabel(referenceMonth: IsoMonthString): string {
  const [year, month] = referenceMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}
