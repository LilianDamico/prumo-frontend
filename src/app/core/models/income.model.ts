import { IsoDateString } from './common.model';

/**
 * Entrada de dinheiro recebida pelo usuário (ex.: salário, renda extra).
 */
export interface Income {
  readonly id: string;
  accountId: string;
  description: string;
  amount: number;
  incomeDate: IsoDateString;
  categoryId: string;
  recurring: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
