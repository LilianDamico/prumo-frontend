import { IsoDateString, IsoMonthString } from './common.model';

/**
 * Cartão de crédito cadastrado pelo usuário.
 *
 * Reflete o contrato `CreditCardResponse` do backend Spring Boot: id, name,
 * institution, creditLimit, closingDay, dueDay, active, createdAt, updatedAt
 * (ISO-8601). Não existe `availableLimit`/`accountId` no backend — este
 * domínio não calcula limite disponível nem se relaciona com `Account`.
 */
export interface CreditCard {
  readonly id: string;
  name: string;
  institution: string;
  creditLimit: number;
  /** Dia do mês em que a fatura fecha (1 a 31). */
  closingDay: number;
  /** Dia do mês em que a fatura vence (1 a 31). */
  dueDay: number;
  active: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

/**
 * Compra feita em um cartão de crédito, à vista ou parcelada.
 */
export interface CreditCardPurchase {
  readonly id: string;
  creditCardId: string;
  description: string;
  totalAmount: number;
  purchaseDate: IsoDateString;
  /** 1 para compras à vista. */
  installmentsCount: number;
  categoryId: string;
}

/**
 * Fatura mensal de um cartão de crédito.
 */
export interface CreditCardInvoice {
  readonly id: string;
  creditCardId: string;
  referenceMonth: IsoMonthString;
  closingDate: IsoDateString;
  dueDate: IsoDateString;
  totalAmount: number;
  paid: boolean;
}
