import { IsoDateString, IsoMonthString } from './common.model';

/**
 * Cartão de crédito cadastrado pelo usuário.
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
