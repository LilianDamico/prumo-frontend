# PRUMO FRONTEND

## PROMPT 0 - CONTEXTO MESTRE DO PROJETO

Você está trabalhando no projeto **Prumo**, uma aplicação brasileira de gestão financeira pessoal.

A pasta raiz do frontend deve ser:

`prumo-frontend`

O Prumo não é apenas um CRUD de receitas e despesas.

Seu propósito é ajudar brasileiros comuns a entender e administrar melhor o próprio dinheiro, inclusive usuários com pouca familiaridade com conceitos financeiros.

Princípio central do produto:

**O usuário não precisa entender finanças para usar o Prumo.
O Prumo precisa entender finanças para ajudar o usuário.**

Regra interna de UX:

**Se o usuário precisar fazer a conta, o Prumo ainda não terminou o trabalho.**

Outro princípio:

**O Prumo não deve apenas mostrar números. Deve explicar o que os números significam para a vida do usuário e sugerir ações úteis.**

## Regras de linguagem

Toda a interface deve estar em português brasileiro.

Usar linguagem simples, direta e não técnica.

Evitar termos financeiros sem explicação.

Sempre que um conceito técnico for necessário, oferecer uma explicação simples.

Exemplo ruim:

`Comprometimento percentual da renda disponível: 47,32%`

Exemplo correto:

`De cada R$ 100 que você recebe, R$ 47 já estão comprometidos.`

Exemplo ruim:

`Saldo líquido projetado após obrigações vincendas`

Exemplo correto:

`Quanto vai sobrar?`

Nunca usar linguagem que julgue o usuário.

Não escrever:

`Você gastou demais.`

Preferir:

`Você gastou R$ 320 a mais do que havia planejado.`

## Stack

Construir utilizando:

* Angular
* TypeScript strict
* Standalone Components
* Angular Router
* Reactive Forms
* Angular Material
* SCSS
* RxJS
* Signals quando fizer sentido
* Chart.js ou Apache ECharts para gráficos
* Vitest para testes unitários, se compatível com a versão Angular instalada
* ESLint/Prettier apenas se integrarem sem complicar a configuração

Não usar:

* NgModules para funcionalidades novas
* Bootstrap
* jQuery
* Mockoon
* backend falso externo
* dependências desnecessárias
* microfrontends
* arquitetura exageradamente complexa

## Arquitetura

Organizar por features e responsabilidades:

src/app/

core/
config/
models/
services/
interceptors/
guards/

shared/
components/
directives/
pipes/
validators/
utils/

layout/
shell/
header/
sidebar/

features/
dashboard/
accounts/
incomes/
expenses/
credit-cards/
debts/
payoff-plan/
purchase-simulator/
financial-education/
reports/
settings/

app.component.ts
app.config.ts
app.routes.ts

## Integração futura

O backend será posteriormente desenvolvido em Java 21 + Spring Boot + PostgreSQL.

Por enquanto, não existe backend.

Portanto:

1. crie interfaces de serviços pensando em futura API REST;
2. crie implementações locais temporárias;
3. utilize localStorage apenas como persistência provisória;
4. mantenha a implementação local desacoplada dos componentes;
5. os componentes nunca devem acessar localStorage diretamente;
6. futuramente deverá ser possível substituir a implementação local por serviços HTTP sem reescrever os componentes.

Não invente endpoints REST nesta etapa.

## Qualidade

TypeScript strict.

Não utilizar `any`.

Preferir tipos explícitos.

Evitar lógica de negócio pesada dentro de componentes.

Separar:

* apresentação
* regras de domínio
* acesso a dados

Usar nomes claros.

Adicionar comentários apenas quando realmente necessários.

Criar componentes reutilizáveis quando houver reutilização real.

Não criar abstrações sem necessidade.

Antes de alterar arquivos existentes, examine o projeto e preserve configurações válidas.

Ao terminar cada etapa:

1. execute build;
2. corrija todos os erros;
3. execute testes existentes;
4. informe quais arquivos foram criados ou alterados;
5. não avance para funcionalidades que não foram solicitadas.

Não implemente nada agora.

Apenas analise estas instruções, examine a pasta atual e me diga se está preparado para começar.

---

# PROMPT 1 - CRIAR O PROJETO ANGULAR

Agora crie o frontend do Prumo.

A pasta atual aberta no VS Code é a pasta destinada ao projeto:

`prumo-frontend`

Se ainda não existir um projeto Angular nela, inicialize um projeto Angular utilizando a versão estável disponível no ambiente.

Requisitos:

* standalone components
* routing habilitado
* SCSS
* TypeScript strict
* sem SSR por enquanto
* sem NgModules de features

Instale e configure Angular Material.

Escolha uma configuração visual inicial neutra e profissional.

Não crie telas funcionais ainda.

Crie apenas a estrutura básica:

src/app/core
src/app/shared
src/app/layout
src/app/features

Dentro de features:

dashboard
accounts
incomes
expenses
credit-cards
debts
payoff-plan
purchase-simulator
financial-education
reports
settings

Configure também rotas lazy-loaded para as features principais.

Crie placeholders mínimos apenas para validar navegação.

Rotas:

/
redireciona para /dashboard

/dashboard
/accounts
/incomes
/expenses
/credit-cards
/debts
/payoff-plan
/purchase-simulator
/financial-education
/reports
/settings

Ao final:

* rode npm install se necessário
* rode npm run build
* corrija erros
* mostre a estrutura principal criada

Não implemente dashboard real ainda.

---

# PROMPT 2 - DESIGN SYSTEM E LAYOUT

Agora implemente a identidade visual inicial do Prumo.

O produto deve transmitir:

* clareza
* estabilidade
* confiança
* acolhimento
* simplicidade
* controle

Não deve parecer:

* banco tradicional
* plataforma de trading
* aplicativo infantil
* aplicativo de criptomoedas
* dashboard corporativo cheio de indicadores

Crie um layout responsivo com:

* sidebar para desktop
* header
* área principal
* navegação adaptada para telas menores

Menu:

Dashboard
Contas
Receitas
Despesas
Cartões
Dívidas
Meu Caminho
Posso comprar?
Me explica
Relatórios
Configurações

Use Angular Material.

Crie componentes reutilizáveis em shared:

PageHeaderComponent
SummaryCardComponent
MoneyValueComponent
StatusBadgeComponent
EmptyStateComponent
InfoExplanationComponent
ActionSuggestionComponent

A aplicação deve atender acessibilidade básica:

* contraste adequado
* labels visíveis
* foco de teclado
* aria-label quando necessário
* não depender exclusivamente de cores
* tamanhos de clique confortáveis

Criar uma área de branding simples:

PRUMO

e a frase institucional:

`O usuário não precisa entender finanças para usar o Prumo. O Prumo precisa entender finanças para ajudar o usuário.`

Não transforme essa frase em banner permanente dentro da aplicação. Use-a apenas em local institucional apropriado.

Execute build ao finalizar.

---

# PROMPT 3 - MODELOS DE DOMÍNIO

Agora modele o domínio financeiro do frontend.

Criar tipos/interfaces TypeScript para:

User

Account

* id
* name
* institution
* type
* initialBalance
* currentBalance
* active

AccountType:

* CHECKING
* SAVINGS
* INVESTMENT
* CASH

Category

* id
* name
* type
* essential

CategoryType:

* INCOME
* EXPENSE

Income

* id
* accountId
* description
* amount
* incomeDate
* categoryId
* recurring

Expense

* id
* accountId
* description
* amount
* dueDate
* paymentDate
* categoryId
* recurring
* status

ExpenseStatus:

* PENDING
* PAID
* OVERDUE
* CANCELLED

Debt

* id
* creditor
* description
* type
* originalAmount
* currentBalance
* interestRateMonthly
* minimumPayment
* installmentAmount
* totalInstallments
* remainingInstallments
* dueDay
* startDate
* status

DebtType:

* CREDIT_CARD
* PERSONAL_LOAN
* OVERDRAFT
* FINANCING
* TAX
* INSTALLMENT
* OTHER

DebtStatus:

* ACTIVE
* NEGOTIATION
* PAID
* DEFAULTED

CreditCard

* id
* name
* institution
* creditLimit
* closingDay
* dueDay
* active

CreditCardPurchase

CreditCardInvoice

MonthlyBudget

FinancialPosition

PurchaseSimulation

PayoffSimulation

Não usar `any`.

Valores monetários devem permanecer `number` no frontend, mas centralize formatação de moeda brasileira em uma utility ou pipe apropriado.

Datas devem possuir estratégia consistente.

Não introduza bibliotecas externas de data sem necessidade.

Execute testes e build.

---

# PROMPT 4 - CAMADA LOCAL DE DADOS

Agora crie uma camada temporária de persistência local.

IMPORTANTE:

Os componentes nunca devem acessar localStorage diretamente.

Crie interfaces ou abstrações de serviços para:

AccountService
IncomeService
ExpenseService
CategoryService
DebtService
CreditCardService
BudgetService

Crie implementações locais utilizando localStorage.

Arquitetura desejada:

component
↓
service/domain service
↓
repository ou data service
↓
localStorage

Essa implementação deve ser facilmente substituível futuramente por HttpClient.

Crie dados iniciais apenas para categorias.

Categorias essenciais sugeridas:

Moradia
Alimentação
Saúde
Transporte
Água
Energia
Gás

Categorias não essenciais:

Lazer
Assinaturas
Restaurantes
Compras
Outros

Receitas:

Salário
Renda extra
Investimentos
Outros

Não crie valores financeiros fictícios para o usuário.

Crie tratamento seguro para localStorage vazio ou dados inválidos.

Crie testes unitários para operações principais.

Execute build e testes.

---

# PROMPT 5 - DASHBOARD

Agora implemente a primeira versão funcional do Dashboard.

O dashboard não deve parecer um terminal financeiro.

Perguntas que a tela precisa responder:

1. Quanto entrou neste mês?
2. Quanto já saiu?
3. Quanto ainda vai sair?
4. Quanto realmente está livre?
5. Há risco de faltar dinheiro?
6. Qual é a próxima conta importante?

Criar cards:

Entrou
Saiu
Ainda falta pagar
Quanto você pode usar
Dívidas

O card principal deve ser:

`Quanto você pode usar`

Esse valor deve ser calculado, não simplesmente mostrar saldo bancário.

Fórmula inicial:

saldo atual das contas

* despesas pendentes do período
* parcelas obrigatórias
* reserva planejada
  = valor realmente disponível

Criar um FinancialPositionService responsável por esse cálculo.

Não colocar essa regra diretamente no componente.

Criar também uma área:

`Como estão suas contas?`

Estados:

NO_PRUMO
ATENCAO
APERTO
URGENTE

Sempre mostrar texto junto ao estado.

Exemplos:

NO_PRUMO:
`Suas contas estão equilibradas.`

ATENCAO:
`Seu orçamento está apertado.`

APERTO:
`Suas despesas estão maiores que sua renda.`

URGENTE:
`Há contas essenciais ou dívidas em risco de atraso.`

Não depender apenas de cores.

Criar seção:

`Próximas contas`

Ordenar por vencimento.

Criar seção:

`O que merece sua atenção`

Somente mostrar alertas realmente relevantes.

Não gerar ruído com dezenas de mensagens.

Execute testes e build.

---

# PROMPT 6 - RECEITAS, DESPESAS E CONTAS

Agora implemente CRUD completo para:

Contas
Receitas
Despesas

Usar Reactive Forms.

CONTAS

Campos:

Nome
Instituição
Tipo
Saldo atual
Ativa

RECEITAS

Campos:

Descrição
Valor
Data
Categoria
Conta
Recorrente

DESPESAS

Campos:

Descrição
Valor
Vencimento
Data de pagamento
Categoria
Conta
Recorrente
Status

A linguagem deve ser amigável.

Evite simplesmente mostrar enums técnicos.

Exemplo:

CHECKING → Conta corrente
SAVINGS → Poupança
INVESTMENT → Investimento
CASH → Dinheiro

ExpenseStatus:

PENDING → Falta pagar
PAID → Pago
OVERDUE → Atrasado
CANCELLED → Cancelado

Criar:

listagem
cadastro
edição
exclusão com confirmação

Mostrar estados vazios úteis.

Exemplo:

`Você ainda não cadastrou nenhuma receita.`

Abaixo:

`Comece pelo salário ou por outra entrada de dinheiro que você recebe com frequência.`

Execute testes e build.

---

# PROMPT 7 - CARTÕES E DÍVIDAS

Agora implemente as telas:

Cartões
Dívidas

CARTÃO

Campos:

Nome
Banco
Limite
Dia de fechamento
Dia de vencimento
Ativo

Criar área de compras do cartão.

Campos:

Descrição
Valor total
Data da compra
Número de parcelas
Categoria

Calcular valor aproximado da parcela automaticamente.

Mostrar linguagem:

`R$ 1.200 em 6 vezes`

e abaixo:

`aproximadamente R$ 200 por mês`

DÍVIDAS

Campos:

Credor
Descrição
Tipo
Valor original
Quanto falta pagar
Juros ao mês, opcional
Pagamento mínimo, opcional
Valor da parcela
Quantidade de parcelas
Parcelas restantes
Dia do vencimento
Situação

Não exigir taxa de juros caso o usuário não saiba.

Ao lado do campo de juros, mostrar:

`Não sabe? Tudo bem. Você pode deixar em branco e completar depois.`

Quando houver taxa informada, fornecer explicação simples.

Exemplo:

`8% ao mês significa cerca de R$ 80 de juros em um mês para cada R$ 1.000 ainda devidos, antes de considerar pagamentos e outras cobranças.`

Deixar claro que é uma aproximação.

Execute build e testes.

---

# PROMPT 8 - "POSSO COMPRAR?"

Agora implemente a feature:

`Posso comprar?`

Objetivo:

O usuário informa uma compra que pretende fazer e o Prumo mostra o impacto dela no orçamento.

Formulário:

Valor da compra
À vista ou parcelado
Quantidade de parcelas, se parcelado
Mês da primeira cobrança

O simulador deve considerar:

receitas previstas
despesas recorrentes
despesas pendentes
parcelas existentes
dívidas
reserva planejada

Criar PurchaseSimulationService.

Não retornar apenas SIM ou NÃO.

Criar estados:

CONFORTAVEL
POSSIVEL_MAS_APERTA
ALTO_RISCO

Exemplos:

CONFORTAVEL:

`Essa compra cabe no seu orçamento atual.`

POSSIVEL_MAS_APERTA:

`Você consegue assumir essa compra, mas seu orçamento ficará apertado.`

Mostrar:

`No mês mais apertado, devem sobrar aproximadamente R$ X.`

ALTO_RISCO:

`Essa compra pode fazer faltar dinheiro para contas que você já assumiu.`

Adicionar:

`Veja o impacto mês a mês`

com visualização simples dos próximos meses.

Nunca escrever:

`Você não pode comprar.`

A decisão pertence ao usuário.

Execute testes e build.

---

# PROMPT 9 - MEU CAMINHO

Agora implemente:

`Meu Caminho`

Objetivo:

Ajudar o usuário a visualizar uma estratégia de redução das dívidas.

Criar interface DebtStrategy.

Implementar inicialmente:

AvalancheStrategy
SnowballStrategy

Avalanche:

priorizar dívidas com maiores juros conhecidos.

Snowball:

priorizar menores saldos.

Se uma dívida não possuir taxa de juros conhecida, tratar isso explicitamente.

Não inventar taxa.

Criar tela que compare as estratégias de forma simples.

Não usar apenas os termos:

Avalanche
Snowball

Mostrar:

`Pagar primeiro as dívidas mais caras`

e

`Eliminar primeiro as menores dívidas`

Pode mostrar o nome técnico secundariamente.

Exemplo:

`Dívidas mais caras primeiro (estratégia avalanche)`

Mostrar:

Total atual das dívidas
Quanto já foi eliminado
Ordem sugerida
Valor mensal disponível para pagamento
Estimativa de tempo
Estimativa de juros apenas quando houver dados suficientes

Quando os dados não forem suficientes, informar:

`Ainda não temos informações suficientes para calcular os juros com segurança.`

Nunca inventar números.

Criar barra de progresso:

`Você começou com R$ X`

`Hoje deve R$ Y`

`Você já eliminou R$ Z`

Execute build e testes.

---

# PROMPT 10 - "ME EXPLICA"

Agora implemente:

`Me explica`

Esta área não deve ser uma enciclopédia financeira.

Ela deve oferecer explicações curtas, contextualizadas e simples.

Criar inicialmente conteúdos para:

Juros
Juros ao mês
CET
Pagamento mínimo do cartão
Saldo devedor
Parcelamento
Reserva de emergência
Renda comprometida
Conta vencida
Negociação de dívida
Amortização

Cada conceito deve conter:

Título
Explicação em português simples
Exemplo em reais quando fizer sentido
`Por que isso importa?`

Exemplo:

CET

`CET é o custo total de um empréstimo ou financiamento. Ele junta juros e outras cobranças para mostrar quanto aquele dinheiro realmente custa.`

Por que isso importa?

`Dois empréstimos com a mesma parcela podem ter custos muito diferentes. O CET ajuda a comparar.`

Evitar jargão.

Criar mecanismo para reutilizar essas explicações dentro de outras telas por meio do InfoExplanationComponent.

Execute build e testes.

---

# PROMPT 11 - ACESSIBILIDADE E PORTUGUÊS SIMPLES

Faça agora uma revisão completa da aplicação.

Objetivo:

Tornar o Prumo compreensível para pessoas com diferentes níveis de escolaridade e familiaridade digital.

Revise todos:

títulos
botões
labels
mensagens
erros
tooltips
estados vazios
alertas

Critérios:

Frases curtas.

Uma ideia por frase.

Evitar palavras técnicas quando houver alternativa simples.

Evitar siglas sem explicação.

Evitar textos em inglês visíveis para o usuário.

Evitar mensagens como:

`Invalid request`

`Required field`

`Validation failed`

Traduzir para mensagens humanas.

Exemplo:

`Informe o valor da despesa.`

Nunca depender exclusivamente de cor.

Verificar navegação por teclado.

Verificar labels.

Verificar aria.

Verificar contraste.

Verificar zoom.

Verificar funcionamento razoável em:

desktop
tablet
celular

Não alterar regras de negócio durante esta revisão.

Execute testes e build.

---

# PROMPT 12 - REVISÃO DE ARQUITETURA

Agora faça uma revisão técnica completa do projeto.

Não reescreva tudo.

Procure especificamente:

duplicação
componentes grandes demais
serviços com responsabilidades misturadas
uso indevido de localStorage
uso de any
subscriptions não encerradas
estado duplicado
lógica financeira dentro de componentes
imports desnecessários
código morto
problemas de acessibilidade
rotas inconsistentes

Garanta que:

componentes não dependam diretamente do localStorage;

regras financeiras estejam em services apropriados;

modelos estejam tipados;

o projeto esteja pronto para futuramente substituir a camada local por uma API REST Spring Boot.

Crie um documento:

`docs/frontend-architecture.md`

Descrevendo:

arquitetura
features
serviços
modelo de dados
persistência temporária
estratégia futura de integração com backend
princípios de UX do Prumo

Inclua no documento:

**O usuário não precisa entender finanças para usar o Prumo.
O Prumo precisa entender finanças para ajudar o usuário.**

E:

**Se o usuário precisar fazer a conta, o Prumo ainda não terminou o trabalho.**

Execute todos os testes e o build.

Somente finalize quando o projeto estiver compilando sem erros.

---

# PROMPT 13 - CHECKPOINT FINAL

Não crie nenhuma nova funcionalidade.

Faça somente uma auditoria do frontend atual.

Me entregue um relatório contendo:

1. funcionalidades concluídas;
2. funcionalidades parcialmente concluídas;
3. erros conhecidos;
4. dívida técnica;
5. cobertura de testes;
6. dependências utilizadas;
7. estrutura de diretórios;
8. serviços criados;
9. telas existentes;
10. pontos que precisarão do backend;
11. contratos/interfaces que já podem orientar a futura API REST;
12. próximos passos recomendados.

Não altere arquivos além do necessário para corrigir erros reais.

Execute:

build
testes

Se algum comando falhar, investigue e corrija antes de concluir.

Não implemente o backend.
