import { IsoDateString, IsoMonthString } from '../models';

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

/**
 * Formata uma data civil ISO (`AAAA-MM-DD`) como `DD/MM/AAAA`, sem passar
 * por `Date`/`DatePipe`. Datas civis (ex.: `incomeDate`, `dueDate`) não
 * representam um instante no tempo, então convertê-las para `Date` arrisca
 * deslocar o dia exibido conforme o timezone do navegador. Esta função
 * opera apenas nos componentes textuais da string, sem esse risco.
 */
export function formatIsoDateAsBr(isoDate: IsoDateString): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${day}/${month}/${year}`;
}
