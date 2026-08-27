/**
 * Indica se uma categoria é usada para classificar receitas ou despesas.
 */
export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

/**
 * Categoria usada para classificar receitas e despesas.
 *
 * Reflete o contrato `CategoryResponse` do backend Spring Boot:
 * id, name, type, active, essential, createdAt, updatedAt (ISO-8601).
 *
 * `essential` marca despesas essenciais (ex.: moradia, saúde) e é usado
 * por `FinancialPositionService` para detectar despesas essenciais em
 * atraso (`hasOverdueEssentialExpense`). É parte oficial do domínio
 * compartilhado entre frontend e backend — o backend rejeita (HTTP 400)
 * categorias com `type = INCOME` e `essential = true`.
 */
export interface Category {
  readonly id: string;
  name: string;
  type: CategoryType;
  active: boolean;
  essential: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
