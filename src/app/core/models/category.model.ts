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
 * id, name, type, active, createdAt, updatedAt (ISO-8601).
 *
 * DIVERGÊNCIA DE CONTRATO — campo `essential`:
 * O modelo local antigo (`LocalCategoryService`) possui um campo
 * `essential` que marca despesas essenciais (ex.: moradia, saúde) e é
 * usado por `FinancialPositionService` para detectar despesas essenciais
 * em atraso (`hasOverdueEssentialExpense`). O backend NÃO possui este
 * campo — não existe em `CategoryResponse`, nem em create/update.
 *
 * Como há uso funcional real (não apenas cosmético), o campo NÃO foi
 * removido nem "inventado" no lado do backend. Ele foi mantido como
 * opcional e é tratado como uma extensão *somente local*:
 * - `LocalCategoryService` continua populando/aceitando `essential`
 *   normalmente (sem mudança de comportamento).
 * - `HttpCategoryService` nunca envia nem recebe `essential` — categorias
 *   vindas da API sempre terão `essential` como `undefined` (equivalente a
 *   "não essencial" para `FinancialPositionService`).
 * - Efeito colateral esperado: com o backend ativo, o alerta de "despesa
 *   essencial em atraso" deixa de disparar até que o backend passe a
 *   suportar esse conceito (ou até se decidir uma outra estratégia de
 *   produto). Esta é uma divergência de contrato reportada, não uma
 *   correção silenciosa.
 */
export interface Category {
  readonly id: string;
  name: string;
  type: CategoryType;
  active: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  /** Extensão somente-local. Ver divergência de contrato acima. */
  essential?: boolean;
}
