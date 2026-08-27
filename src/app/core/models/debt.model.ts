import { IsoDateString } from './common.model';

/**
 * Tipos de dívida reconhecidos pelo Prumo.
 */
export enum DebtType {
  CREDIT_CARD = 'CREDIT_CARD',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  OVERDRAFT = 'OVERDRAFT',
  FINANCING = 'FINANCING',
  TAX = 'TAX',
  INSTALLMENT = 'INSTALLMENT',
  OTHER = 'OTHER',
}

/**
 * Situação atual de uma dívida.
 */
export enum DebtStatus {
  ACTIVE = 'ACTIVE',
  NEGOTIATION = 'NEGOTIATION',
  PAID = 'PAID',
  DEFAULTED = 'DEFAULTED',
}

/**
 * Dívida do usuário (empréstimo, financiamento, cartão, etc.).
 *
 * Os campos `interestRateMonthly` e `minimumPayment` são opcionais porque o
 * Prumo nunca deve exigir ou inventar uma taxa de juros que o usuário não
 * saiba informar. Quando ausentes, o Prumo deve deixar explícito que ainda
 * não há dados suficientes para estimativas que dependam desses valores.
 */
export interface Debt {
  readonly id: string;
  creditor: string;
  description: string;
  type: DebtType;
  originalAmount: number;
  currentBalance: number;
  /** Percentual ao mês (ex.: 8 representa 8% ao mês). Pode ser desconhecido. */
  interestRateMonthly?: number;
  minimumPayment?: number;
  installmentAmount?: number;
  totalInstallments?: number;
  remainingInstallments?: number;
  /** Dia do mês em que a dívida vence (1 a 31). */
  dueDay: number;
  startDate: IsoDateString;
  status: DebtStatus;
}
