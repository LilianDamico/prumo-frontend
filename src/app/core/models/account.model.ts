/**
 * Tipos de conta que o usuário pode cadastrar.
 */
export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  INVESTMENT = 'INVESTMENT',
  CASH = 'CASH',
}

/**
 * Conta financeira do usuário (corrente, poupança, investimento ou dinheiro
 * em espécie).
 */
export interface Account {
  readonly id: string;
  name: string;
  institution: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  active: boolean;
}
