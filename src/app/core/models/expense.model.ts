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
  /** Preenchido apenas quando a despesa já foi paga. */
  paymentDate?: IsoDateString;
  categoryId: string;
  recurring: boolean;
  status: ExpenseStatus;
}
