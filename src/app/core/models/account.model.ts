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
 *
 * Reflete o contrato `AccountResponse` do backend Spring Boot: id, name,
 * institution, type, currentBalance, active, createdAt, updatedAt
 * (ISO-8601). `currentBalance` é o único saldo da conta — pronto, não
 * derivado de incomes/expenses pelo frontend.
 */
export interface Account {
  readonly id: string;
  name: string;
  institution: string | null;
  type: AccountType;
  currentBalance: number;
  active: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
