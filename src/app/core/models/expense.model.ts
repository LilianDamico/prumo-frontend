import { IsoDateString } from './common.model';

/**
 * Situação de pagamento de uma despesa.
 */
export enum ExpenseStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

/**
 * Despesa (conta a pagar) do usuário.
 */
export interface Expense {
  readonly id: string;
  accountId: string;
  description: string;
  amount: number;
  dueDate: IsoDateString;
  /**
   * Data em que a despesa foi paga. Espelha diretamente o JSON do backend
   * (`LocalDate` nullable): `null` quando a despesa não está `PAID`, nunca
   * `undefined` — evita ambiguidade entre "sem valor" e "campo ausente".
   */
  paymentDate: IsoDateString | null;
  categoryId: string;
  recurring: boolean;
  status: ExpenseStatus;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
