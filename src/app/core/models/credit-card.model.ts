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
 *
 * Reflete o contrato `CreditCardPurchaseResponse` do backend: id,
 * creditCardId, categoryId, description, purchaseDate, totalAmount,
 * installmentCount, installmentAmount (calculado), createdAt, updatedAt.
 * `installmentAmount` é somente-resposta (calculado pelo backend como
 * `totalAmount / installmentCount`, HALF_UP, escala 2) — nunca é
 * calculado nem persistido pelo frontend como fonte de verdade.
 */
export interface CreditCardPurchase {
  readonly id: string;
  creditCardId: string;
  categoryId: string;
  description: string;
  purchaseDate: IsoDateString;
  totalAmount: number;
  /** 1 para compras à vista. Backend aceita de 1 a 99. */
  installmentCount: number;
  /** Somente-resposta: calculado pelo backend, nunca enviado pelo cliente. */
  readonly installmentAmount?: number;
  readonly createdAt?: string;
  readonly updatedAt?: string;
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
