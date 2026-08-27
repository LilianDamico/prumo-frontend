# Arquitetura do Frontend — Prumo

> Documento derivado do estado real do código em `src/app` (auditoria de
> PROMPT 12). Não descreve arquitetura planejada, apenas o que existe hoje.

## Visão geral

O Prumo é um SPA Angular (standalone components, signals) que hoje persiste
todos os dados do usuário em `localStorage`. A arquitetura já foi construída
prevendo a substituição dessa persistência por uma API REST em Java + Spring
Boot, sem reescrever componentes ou regras de negócio.

## Princípios do produto

> **O usuário não precisa entender finanças para usar o Prumo. O Prumo
> precisa entender finanças para ajudar o usuário.**

> **Se o usuário precisar fazer a conta, o Prumo ainda não terminou o
> trabalho.**

Essas frases orientam tanto a UX quanto as decisões técnicas: os serviços de
domínio (não os componentes) concentram os cálculos, e os resultados são
sempre tipados (enums), nunca texto pronto — quem traduz para o usuário é a
camada de apresentação.

## Estrutura de diretórios

```
src/app/
  core/
    models/        # entidades e tipos de domínio (sem lógica)
    services/       # contratos abstratos + implementações + regras
      local/        # implementações concretas baseadas em localStorage
      storage/       # infraestrutura de persistência (LocalStorageService, repositório genérico)
      data/          # conteúdo estático (seeds de categoria, tópicos de educação financeira)
    utils/          # funções puras (datas, dinheiro, texto, ids, juros)
  features/         # uma pasta por tela/funcionalidade (accounts, incomes, expenses,
                    # credit-cards, debts, payoff-plan, purchase-simulator,
                    # financial-education, dashboard, reports, settings)
  shared/
    components/     # componentes de apresentação reutilizáveis
  layout/           # header, sidebar, shell da aplicação
```

## Features

Cada feature é um componente standalone de página (`*-page`) que injeta
serviços de domínio via `inject()`, usa Reactive Forms para entrada de dados
e signals para estado local/derivado. Nenhuma feature acessa `localStorage`
diretamente nem duplica cálculos financeiros — todas dependem de serviços de
`core/services`.

## Shared components

Componentes de apresentação puros e reutilizados entre features:
`PageHeader`, `MoneyValue`, `StatusBadge`, `SummaryCard`, `InfoExplanation`,
`ActionSuggestion`, `EmptyState`, `ConfirmDialog`. Nenhum contém regra
financeira; todos recebem dados já calculados via `input()`.

## Models

Ver seção "Modelos" abaixo para a classificação completa. Em resumo:
entidades persistidas (`Account`, `Income`, `Expense`, `Debt`, `CreditCard`,
`CreditCardPurchase`, `Category`, `MonthlyBudget`), modelos de
entrada/resultado de cálculo (`PurchaseSimulationRequest`/`Result`,
`PayoffSimulation`), e conteúdo estático (`FinancialEducationTopic`).

## Services

Classificados em quatro categorias (ver seção 4 do relatório):
persistência (CRUD por entidade), domínio/cálculo (`FinancialPositionService`,
`PurchaseSimulationService`, `PayoffPlanService`, `DebtStrategy`), conteúdo
(`FinancialEducationService`) e infraestrutura (`LocalStorageService`,
`LocalCollectionRepository`).

## Persistência atual

Cada entidade tem:

1. Um contrato abstrato (`AccountService`, `IncomeService`, etc.), estendendo
   `CrudService<TEntity, TCreateInput, TUpdateInput>` — todos os métodos
   retornam `Observable`.
2. Uma implementação local (`LocalAccountService`, etc.) que usa
   `LocalCollectionRepository` sobre `LocalStorageService`, com chave de
   `localStorage` própria (ex.: `prumo.accounts`).

Nenhum componente ou serviço de domínio conhece a chave de `localStorage` ou
a implementação concreta — apenas o contrato abstrato via injeção de
dependência.

## Estratégia de providers

`core/services/core.providers.ts` centraliza a ligação contrato → implementação:

```ts
export const CORE_SERVICE_PROVIDERS: Provider[] = [
  { provide: AccountService, useClass: LocalAccountService },
  { provide: CategoryService, useClass: LocalCategoryService },
  { provide: IncomeService, useClass: LocalIncomeService },
  { provide: ExpenseService, useClass: LocalExpenseService },
  { provide: DebtService, useClass: LocalDebtService },
  { provide: CreditCardService, useClass: LocalCreditCardService },
  { provide: CreditCardPurchaseService, useClass: LocalCreditCardPurchaseService },
  { provide: BudgetService, useClass: LocalBudgetService },
];
```

A futura migração para HTTP consiste em criar `HttpAccountService` (etc.),
implementando o mesmo contrato abstrato, e trocar o `useClass` de cada
entrada — sem alterar nenhuma feature.

## Regras de domínio

- `FinancialPositionService`: calcula "quanto sobra de verdade" e o estado
  geral das contas (`FinancialPositionStatus`), a partir de contas, receitas,
  despesas e dívidas do mês.
- `PurchaseSimulationService`: simula o impacto de uma compra mês a mês,
  reaproveitando as mesmas fontes de dados do `FinancialPositionService`.
- `PayoffPlanService` + `DebtStrategy` (`AvalancheStrategy`/`SnowballStrategy`):
  ordenam dívidas ativas por estratégia e estimam prazo/juros quando os dados
  permitem.

Todos retornam tipos/enums (`FinancialPositionStatus`,
`PurchaseSimulationOutcome`, `DebtPayoffStrategyType`), nunca texto pronto —
a tradução para português fica nos componentes/`labels.util.ts`.

## Educação financeira

`FinancialEducationService` expõe um catálogo estático (`FINANCIAL_EDUCATION_TOPICS`,
25 tópicos) com busca por título/palavra-chave/termo popular, normalizada
(minúsculas, sem acento). O conteúdo vive em um único arquivo de dados
(`core/services/data/financial-education-topics.data.ts`), consumido tanto
pela página "Me explica" quanto pelas integrações contextuais
(`InfoExplanation` + `learnMoreSlug`).

## Estratégia futura de API

Ver `docs/api-contract-draft.md` para o rascunho de contrato REST. Resumo:
endpoints CRUD REST convencionais por entidade persistida
(`/api/v1/accounts`, `/api/v1/incomes`, etc.); os cálculos
(`FinancialPosition`, simulação de compra, plano de quitação) permanecem
recomendados no frontend nesta fase (ver justificativa no documento), com
endpoints de cálculo marcados como `PROPOSTA FUTURA` caso a decisão mude.

## Estratégia de datas

- Datas de calendário (`Expense.dueDate`, `Income.incomeDate`,
  `Debt.startDate`, `CreditCardPurchase.purchaseDate`): `IsoDateString`
  (`AAAA-MM-DD`).
- Mês de referência (`FinancialPosition.referenceMonth`,
  `MonthlyBudget`, simulações): `IsoMonthString` (`AAAA-MM`).
- Não há timestamps (`createdAt`/`updatedAt`) nos models atuais — quando o
  backend os introduzir, recomenda-se ISO 8601 completo
  (`AAAA-MM-DDTHH:mm:ssZ`).

Essa convenção já é consistente em todo o frontend; nenhuma mudança foi
necessária.

## Estratégia monetária

Todos os valores monetários são `number` no frontend (JS não tem `BigDecimal`
nativo, e a UI sempre passa por `MoneyValue`/`CurrencyPipe`/`Intl.NumberFormat`
para exibição em português). **Recomendação para o backend**: usar
`BigDecimal` em Java para todos os campos monetários persistidos e nos
cálculos de domínio, nunca `float`/`double`, para evitar erros de
arredondamento em somas e simulações. O contrato JSON deve trafegar números
(ou strings decimais, se precisão exigir) que o frontend converte para
`number` ao consumir.

## Tratamento de erros futuro

Hoje os métodos locais lançam `Error` (ex.: "Conta não encontrada") apenas em
casos de uso interno; a UI não tem tratamento centralizado de erro porque
`localStorage` raramente falha de forma recuperável. Para HTTP, recomenda-se:

- Um `HttpInterceptor` central para mapear respostas de erro HTTP (400, 401,
  403, 404, 409, 422, 500, timeout, rede indisponível) para mensagens em
  português, sem espalhar tratamento pelos componentes.
- Manter o mesmo contrato `Observable` dos serviços — o interceptor apenas
  intercepta antes de chegar ao componente.
- Nenhum interceptor foi implementado nesta etapa (fora de escopo do PROMPT 12).

## Migração localStorage → HTTP

1. Implementar `HttpAccountService` (e equivalentes) satisfazendo os mesmos
   contratos abstratos, usando `HttpClient` e retornando `Observable` (já é o
   formato usado hoje — nenhuma mudança de assinatura necessária).
2. Trocar o `useClass` de cada entrada em `CORE_SERVICE_PROVIDERS`.
3. Nenhum componente, nenhum serviço de domínio
   (`FinancialPositionService`, `PurchaseSimulationService`, etc.) precisa
   mudar, pois todos dependem apenas dos contratos abstratos.
4. Avaliar, no momento da migração, se os métodos síncronos-por-natureza
   (ex.: leitura instantânea local) precisam de estados de carregamento
   (`loading`/`error` signals) nos componentes, já que HTTP introduz latência
   real que hoje é ausente.

## Mapa de dependências

Hoje:

```
UI (features/*-page)
  ↓
Domain/Application Services (FinancialPositionService, PurchaseSimulationService, PayoffPlanService, DebtStrategy)
  ↓
Persistence Contracts (AccountService, IncomeService, ExpenseService, DebtService, CreditCardService, CreditCardPurchaseService, CategoryService, BudgetService)
  ↓
Local Implementations (LocalAccountService, LocalIncomeService, ...)
  ↓
LocalStorageService → localStorage
```

Futuro:

```
UI (features/*-page)
  ↓
Domain/Application Services (inalterados)
  ↓
Persistence Contracts (inalterados)
  ↓
HTTP Implementations (HttpAccountService, HttpIncomeService, ...)
  ↓
Spring Boot REST API
  ↓
PostgreSQL
```

## Matriz de migração

| Área | Hoje | Futuro | Impacto esperado |
| ---- | ---- | ------ | ----------------- |
| Contas | `LocalAccountService` | `HttpAccountService` | Baixo |
| Categorias | `LocalCategoryService` | `HttpCategoryService` | Baixo |
| Receitas | `LocalIncomeService` | `HttpIncomeService` | Baixo |
| Despesas | `LocalExpenseService` | `HttpExpenseService` | Baixo |
| Dívidas | `LocalDebtService` | `HttpDebtService` | Baixo |
| Cartões | `LocalCreditCardService` | `HttpCreditCardService` | Baixo |
| Compras de cartão | `LocalCreditCardPurchaseService` | `HttpCreditCardPurchaseService` | Baixo |
| Orçamento mensal | `LocalBudgetService` | `HttpBudgetService` | Baixo |
| Posição financeira (`FinancialPositionService`) | Cálculo no frontend | Recomendado permanecer no frontend | Nenhum (ver justificativa em `docs/api-contract-draft.md`) |
| Posso comprar (`PurchaseSimulationService`) | Cálculo no frontend | Recomendado permanecer no frontend nesta fase; backend seria necessário só se o cálculo precisar ser compartilhado entre clientes (web/mobile) ou auditado no servidor | Médio, se migrado |
| Meu Caminho (`PayoffPlanService`/`DebtStrategy`) | Cálculo no frontend | Mesma recomendação do item anterior | Médio, se migrado |
| Me explica (`FinancialEducationService`) | Conteúdo estático no frontend | Poderia migrar para backend/CMS para permitir atualização sem deploy | Médio (feature futura, não dívida técnica) |

## Dívida técnica

- **Bundle inicial acima do orçamento** (590 kB vs 500 kB configurado) —
  conhecido desde PROMPT 9/10, não resolvido por decisão explícita (evitar
  otimização prematura/remoção de Angular Material).
- **Reports e Settings são placeholders** — não é dívida técnica, é feature
  planejada para etapa futura (PROMPT 13 ou posterior).
- **Ausência de autenticação/autorização** — esperado nesta fase (frontend
  local/MVP); necessário antes de produção.
- **Sem `HttpInterceptor`/estratégia de erro centralizada** — não é
  necessário hoje (persistência local raramente falha de forma
  recuperável), mas deve ser criado junto com a primeira implementação HTTP.
- **Sem estados de `loading` nos componentes** — aceitável hoje porque
  `localStorage` é síncrono (o `Observable` resolve na mesma tick); passará a
  ser necessário assim que a latência de rede for introduzida.
- **`localStorage` guarda dados financeiros em texto puro** — aceitável
  apenas para protótipo local; não deve ser considerado seguro para dados
  reais de produção.

## Segurança

Avaliação apenas arquitetural, sem implementação nesta etapa:

- Hoje, todos os dados financeiros do usuário ficam em `localStorage`, sem
  criptografia, acessíveis a qualquer script no mesmo domínio. Aceitável
  apenas para protótipo/MVP local, sem múltiplos usuários e sem dados reais
  sensíveis expostos publicamente.
- Para uma versão real, será necessário: autenticação (ex.: OAuth2/JWT),
  autorização por usuário (cada registro pertence a um `userId` no backend),
  HTTPS obrigatório, conformidade com a LGPD (finalidade, consentimento,
  direito de exclusão), armazenamento seguro de tokens (não em
  `localStorage` puro — preferir cookies `httpOnly` ou storage seguro
  equivalente), e logs de aplicação/backend que nunca incluam valores
  monetários ou dados pessoais sensíveis em texto claro.

