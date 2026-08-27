import { AccountType, DebtStatus, DebtType, ExpenseStatus, FinancialEducationCategory } from '../models';

/**
 * Rótulos amigáveis para `AccountType`, exibidos em vez do enum técnico.
 */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.CHECKING]: 'Conta corrente',
  [AccountType.SAVINGS]: 'Poupança',
  [AccountType.INVESTMENT]: 'Investimento',
  [AccountType.CASH]: 'Dinheiro',
};

/**
 * Rótulos amigáveis para `ExpenseStatus`, exibidos em vez do enum técnico.
 */
export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  [ExpenseStatus.PENDING]: 'Falta pagar',
  [ExpenseStatus.PAID]: 'Pago',
  [ExpenseStatus.OVERDUE]: 'Atrasado',
  [ExpenseStatus.CANCELLED]: 'Cancelado',
};

/**
 * Rótulos amigáveis para `DebtType`, exibidos em vez do enum técnico.
 */
export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  [DebtType.CREDIT_CARD]: 'Cartão de crédito',
  [DebtType.PERSONAL_LOAN]: 'Empréstimo pessoal',
  [DebtType.OVERDRAFT]: 'Cheque especial',
  [DebtType.FINANCING]: 'Financiamento',
  [DebtType.TAX]: 'Imposto',
  [DebtType.INSTALLMENT]: 'Parcelamento',
  [DebtType.OTHER]: 'Outra',
};

/**
 * Rótulos amigáveis para `DebtStatus`, exibidos em vez do enum técnico.
 */
export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  [DebtStatus.ACTIVE]: 'Em dia',
  [DebtStatus.NEGOTIATION]: 'Em negociação',
  [DebtStatus.PAID]: 'Quitada',
  [DebtStatus.DEFAULTED]: 'Em atraso grave',
};

/**
 * Rótulos amigáveis para `FinancialEducationCategory`, exibidos em vez do
 * enum técnico nas telas de "Me explica".
 */
export const FINANCIAL_EDUCATION_CATEGORY_LABELS: Record<FinancialEducationCategory, string> = {
  [FinancialEducationCategory.DAILY_ACCOUNTS]: 'Contas do dia a dia',
  [FinancialEducationCategory.CREDIT_CARD]: 'Cartão',
  [FinancialEducationCategory.DEBTS]: 'Dívidas',
  [FinancialEducationCategory.LOANS]: 'Empréstimos',
  [FinancialEducationCategory.ORGANIZATION]: 'Organização',
  [FinancialEducationCategory.SAVINGS_AND_SECURITY]: 'Reserva e segurança',
};

