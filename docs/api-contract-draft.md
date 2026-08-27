# Rascunho de contrato de API — Prumo (PROPOSTA, backend não implementado)

> Derivado do frontend existente (`src/app/core/models`, `src/app/core/services`).
> Não inclui nenhum recurso que o frontend não utilize hoje. Nenhum destes
> endpoints existe — este documento é insumo para a futura implementação em
> Spring Boot.

## Convenções gerais

- IDs: `Long` no backend / `number` no JSON (hoje o frontend usa `string`
  com UUID gerado localmente; ao migrar, o backend deve gerar o ID e o
  frontend passa a tratá-lo apenas como identificador opaco).
- Datas de calendário: `AAAA-MM-DD` (`LocalDate` em Java).
- Mês de referência: `AAAA-MM` (string simples, sem tipo específico em Java).
- Valores monetários: `BigDecimal` no backend; JSON transporta como número
  decimal.
- Autenticação: fora de escopo desta etapa (nenhum endpoint abaixo está
  protegido ainda).

## Contas — `Account`

```
GET    /api/v1/accounts
GET    /api/v1/accounts/{id}
POST   /api/v1/accounts
PUT    /api/v1/accounts/{id}
DELETE /api/v1/accounts/{id}
```

Corpo (`POST`/`PUT`), espelhando `CreateAccountInput`/`UpdateAccountInput`:

```json
{
  "name": "Conta corrente",
  "institution": "Banco X",
  "type": "CHECKING",
  "initialBalance": 1000.00,
  "currentBalance": 1234.56,
  "active": true
}
```

## Categorias — `Category`

```
GET    /api/v1/categories
GET    /api/v1/categories/{id}
POST   /api/v1/categories
PUT    /api/v1/categories/{id}
DELETE /api/v1/categories/{id}
```

## Receitas — `Income`

```
GET    /api/v1/incomes
GET    /api/v1/incomes/{id}
POST   /api/v1/incomes
PUT    /api/v1/incomes/{id}
DELETE /api/v1/incomes/{id}
```

## Despesas — `Expense`

```
GET    /api/v1/expenses
GET    /api/v1/expenses/{id}
POST   /api/v1/expenses
PUT    /api/v1/expenses/{id}
DELETE /api/v1/expenses/{id}
```

## Dívidas — `Debt`

```
GET    /api/v1/debts
GET    /api/v1/debts/{id}
POST   /api/v1/debts
PUT    /api/v1/debts/{id}
DELETE /api/v1/debts/{id}
```

## Cartões de crédito — `CreditCard`

```
GET    /api/v1/credit-cards
GET    /api/v1/credit-cards/{id}
POST   /api/v1/credit-cards
PUT    /api/v1/credit-cards/{id}
DELETE /api/v1/credit-cards/{id}
```

## Compras de cartão — `CreditCardPurchase`

```
GET    /api/v1/credit-cards/{cardId}/purchases
GET    /api/v1/credit-card-purchases/{id}
POST   /api/v1/credit-card-purchases
PUT    /api/v1/credit-card-purchases/{id}
DELETE /api/v1/credit-card-purchases/{id}
```

> Nota: `CreditCardInvoice` existe como modelo, mas hoje não há um serviço de
> persistência dedicado a faturas no frontend (é derivado/calculado a partir
> de compras). Nenhum endpoint é proposto para ele nesta etapa — apenas
> registrado aqui para não ser esquecido caso a regra de faturas seja
> futuramente movida para o backend.

## Orçamento mensal — `MonthlyBudget`

```
GET    /api/v1/budgets?month={AAAA-MM}
GET    /api/v1/budgets/{id}
POST   /api/v1/budgets
PUT    /api/v1/budgets/{id}
DELETE /api/v1/budgets/{id}
```

Corresponde a `BudgetService.getByMonth(referenceMonth)`.

## Cálculos financeiros — recomendação

Os cálculos abaixo (`FinancialPositionService`, `PurchaseSimulationService`,
`PayoffPlanService`) são **recomendados para permanecer no frontend** nesta
fase, pois:

1. Dependem apenas de dados já buscados via os endpoints CRUD acima —
   nenhuma lógica adicional do servidor é necessária para calculá-los.
2. Já são determinísticos, testados unitariamente e não envolvem dados
   sensíveis que precisem ficar apenas no servidor.
3. Mover para o backend adicionaria uma chamada de rede extra a cada
   interação do simulador (ex.: a cada mudança de parcela), piorando a
   responsividade sem ganho evidente.

Caso essa decisão mude no futuro (por exemplo, se o cálculo precisar ser
compartilhado entre múltiplos clientes — app mobile, futura IA — ou auditado
no servidor), os seguintes endpoints são propostos:

```
POST /api/v1/simulations/purchase        [PROPOSTA FUTURA]
POST /api/v1/debts/payoff-simulations    [PROPOSTA FUTURA]
GET  /api/v1/financial-position?month={AAAA-MM}   [PROPOSTA FUTURA]
```

Nenhum desses três endpoints deve ser implementado até que essa decisão seja
tomada explicitamente; eles não existem hoje.

## Educação financeira — `FinancialEducationTopic`

Hoje o conteúdo é estático no frontend. Caso futuramente seja servido pelo
backend (para permitir atualização de conteúdo sem novo deploy do frontend),
o contrato de leitura seria simples (somente leitura, sem CRUD de usuário):

```
GET /api/v1/financial-education-topics             [PROPOSTA FUTURA]
GET /api/v1/financial-education-topics/{slug}      [PROPOSTA FUTURA]
```

Não implementado nesta etapa.
