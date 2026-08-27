import { Category, CategoryType } from '../../models';

/**
 * Conjunto inicial de categorias sugeridas ao usuário. Nenhum valor
 * financeiro é criado junto — apenas as categorias, para que o usuário
 * possa começar a classificar receitas e despesas.
 */
export const DEFAULT_CATEGORIES: readonly Category[] = [
  // Despesas essenciais
  { id: 'moradia', name: 'Moradia', type: CategoryType.EXPENSE, active: true, essential: true },
  {
    id: 'alimentacao',
    name: 'Alimentação',
    type: CategoryType.EXPENSE,
    active: true,
    essential: true,
  },
  { id: 'saude', name: 'Saúde', type: CategoryType.EXPENSE, active: true, essential: true },
  {
    id: 'transporte',
    name: 'Transporte',
    type: CategoryType.EXPENSE,
    active: true,
    essential: true,
  },
  { id: 'agua', name: 'Água', type: CategoryType.EXPENSE, active: true, essential: true },
  { id: 'energia', name: 'Energia', type: CategoryType.EXPENSE, active: true, essential: true },
  { id: 'gas', name: 'Gás', type: CategoryType.EXPENSE, active: true, essential: true },
  // Despesas não essenciais
  { id: 'lazer', name: 'Lazer', type: CategoryType.EXPENSE, active: true, essential: false },
  {
    id: 'assinaturas',
    name: 'Assinaturas',
    type: CategoryType.EXPENSE,
    active: true,
    essential: false,
  },
  {
    id: 'restaurantes',
    name: 'Restaurantes',
    type: CategoryType.EXPENSE,
    active: true,
    essential: false,
  },
  { id: 'compras', name: 'Compras', type: CategoryType.EXPENSE, active: true, essential: false },
  {
    id: 'outros-despesa',
    name: 'Outros',
    type: CategoryType.EXPENSE,
    active: true,
    essential: false,
  },
  // Receitas
  { id: 'salario', name: 'Salário', type: CategoryType.INCOME, active: true, essential: false },
  {
    id: 'renda-extra',
    name: 'Renda extra',
    type: CategoryType.INCOME,
    active: true,
    essential: false,
  },
  {
    id: 'investimentos',
    name: 'Investimentos',
    type: CategoryType.INCOME,
    active: true,
    essential: false,
  },
  {
    id: 'outros-receita',
    name: 'Outros',
    type: CategoryType.INCOME,
    active: true,
    essential: false,
  },
];
