import { FinancialEducationCategory, FinancialEducationTopic } from '../../models';

/**
 * Conteúdo de "Me explica": única fonte de texto explicativo do Prumo,
 * reutilizada tanto pela página de busca quanto pelas explicações
 * contextuais (`InfoExplanation`) em outras telas. Escrito em português
 * simples, sem jargão bancário desnecessário, sem inventar taxas ou
 * fórmulas exatas quando o valor é apenas uma aproximação.
 */
export const FINANCIAL_EDUCATION_TOPICS: FinancialEducationTopic[] = [
  {
    id: 'juros',
    slug: 'juros',
    title: 'Juros',
    shortExplanation: 'Juros são o valor a mais que você paga por usar dinheiro emprestado.',
    whyItMatters:
      'Entender os juros ajuda a comparar propostas de crédito e a saber quanto uma dívida ou parcelamento realmente custa.',
    example:
      'Se você pega R$ 1.000 emprestados e depois paga R$ 1.100, os R$ 100 a mais são os juros.',
    relatedTopics: ['juros-ao-mes', 'juros-compostos', 'cet'],
    keywords: ['juros', 'quanto custa emprestar', 'preço do dinheiro'],
    category: FinancialEducationCategory.LOANS,
  },
  {
    id: 'juros-ao-mes',
    slug: 'juros-ao-mes',
    title: 'Juros ao mês',
    shortExplanation: 'É a taxa de juros cobrada a cada mês sobre o valor que você ainda deve.',
    whyItMatters:
      'Uma taxa mensal pequena pode virar um valor grande ao longo de vários meses, especialmente se a dívida não for paga.',
    example:
      'Uma dívida de R$ 1.000 com juros de 5% ao mês gera aproximadamente R$ 50 de juros no primeiro mês, antes de considerar pagamentos e outras cobranças. É uma aproximação.',
    relatedTopics: ['juros', 'juros-compostos', 'saldo-devedor'],
    keywords: ['juros ao mes', 'taxa mensal', 'juros mensais', 'quanto rende a divida'],
    category: FinancialEducationCategory.LOANS,
  },
  {
    id: 'juros-compostos',
    slug: 'juros-compostos',
    title: 'Juros compostos',
    shortExplanation:
      'É quando os juros de um mês passam a fazer parte da dívida e também geram juros no mês seguinte.',
    whyItMatters:
      'É por isso que uma dívida sem pagamento pode crescer cada vez mais rápido, mês após mês.',
    example:
      'Se você deve R$ 1.000 e não paga nada, no mês seguinte os juros passam a incidir sobre um valor maior que R$ 1.000 (a dívida original mais os juros já gerados). O valor exato depende das condições de cada contrato.',
    relatedTopics: ['juros', 'juros-ao-mes', 'saldo-devedor'],
    keywords: ['juros compostos', 'juros sobre juros', 'divida que so cresce', 'bola de neve da divida'],
    category: FinancialEducationCategory.LOANS,
  },
  {
    id: 'cet',
    slug: 'cet',
    title: 'CET (Custo Efetivo Total)',
    shortExplanation: 'CET significa Custo Efetivo Total: o quanto um empréstimo ou financiamento custa de verdade.',
    whyItMatters:
      'Por isso, olhar apenas a taxa de juros ou o valor da parcela pode não mostrar quanto o crédito realmente custa. O CET pode incluir juros, tarifas, impostos, seguros e outras cobranças quando aplicáveis.',
    example:
      'Duas propostas podem ter a mesma taxa de juros, mas um CET diferente por causa de tarifas ou seguros embutidos.',
    relatedTopics: ['juros', 'juros-ao-mes', 'emprestimo', 'financiamento'],
    keywords: ['cet', 'custo efetivo total', 'custo do emprestimo', 'quanto custa de verdade', 'taxas escondidas'],
    category: FinancialEducationCategory.LOANS,
  },
  {
    id: 'pagamento-minimo-cartao',
    slug: 'pagamento-minimo-cartao',
    title: 'Pagamento mínimo do cartão',
    shortExplanation:
      'É o menor valor que o cartão aceita para não considerar a fatura em atraso — mas não quita a dívida.',
    whyItMatters:
      'Pagar apenas o mínimo não significa quitar a fatura. O restante continua sendo uma dívida e pode ter juros e outras cobranças.',
    example:
      'Se sua fatura é de R$ 1.000 e você paga apenas R$ 200, ainda existe um valor que precisa ser pago. Dependendo das condições do cartão, podem existir juros e outras cobranças sobre o restante.',
    relatedTopics: ['fatura-cartao', 'limite-cartao', 'saldo-devedor'],
    keywords: [
      'pagamento minimo',
      'pagar so uma parte do cartao',
      'pagar so o minimo da fatura',
      'nao pagar a fatura inteira',
    ],
    category: FinancialEducationCategory.CREDIT_CARD,
  },
  {
    id: 'fatura-cartao',
    slug: 'fatura-cartao',
    title: 'Fatura do cartão',
    shortExplanation: 'É a lista de tudo que você comprou no cartão em um período, com o total a pagar.',
    whyItMatters: 'Acompanhar a fatura ajuda a não ser surpreendido pelo valor total no fim do mês.',
    relatedTopics: ['pagamento-minimo-cartao', 'limite-cartao', 'parcelamento'],
    keywords: ['fatura', 'fatura do cartao', 'conta do cartao', 'extrato do cartao'],
    category: FinancialEducationCategory.CREDIT_CARD,
  },
  {
    id: 'limite-cartao',
    slug: 'limite-cartao',
    title: 'Limite do cartão',
    shortExplanation: 'É o valor máximo que você pode gastar no cartão de crédito.',
    whyItMatters:
      'Usar todo o limite disponível pode dificultar o pagamento da fatura e comprometer outras contas do mês.',
    relatedTopics: ['fatura-cartao', 'pagamento-minimo-cartao'],
    keywords: ['limite do cartao', 'quanto posso gastar no cartao', 'limite de credito'],
    category: FinancialEducationCategory.CREDIT_CARD,
  },
  {
    id: 'parcelamento',
    slug: 'parcelamento',
    title: 'Parcelamento',
    shortExplanation: 'É dividir o pagamento de uma compra ou dívida em várias partes, ao longo de vários meses.',
    whyItMatters:
      'Parcelar pode facilitar o pagamento no momento da compra, mas compromete parte da sua renda nos meses seguintes.',
    example:
      'Uma compra de R$ 1.200 em 6 vezes gera parcelas de R$ 200, sem juros informados, salvo quando o contrato indicar o contrário.',
    relatedTopics: ['fatura-cartao', 'renda-comprometida', 'saldo-devedor'],
    keywords: ['parcelamento', 'parcelar', 'dividir em vezes', 'comprar parcelado'],
    category: FinancialEducationCategory.CREDIT_CARD,
  },
  {
    id: 'saldo-devedor',
    slug: 'saldo-devedor',
    title: 'Saldo devedor',
    shortExplanation: 'É quanto ainda falta pagar de uma dívida, empréstimo ou financiamento.',
    whyItMatters:
      'Saber o saldo devedor ajuda a entender o tamanho real de uma dívida, além do valor da parcela mensal.',
    example:
      'Se você tomou R$ 1.000 emprestados e já pagou R$ 300 (sem contar juros), seu saldo devedor pode ser de aproximadamente R$ 700.',
    relatedTopics: ['juros-ao-mes', 'amortizacao', 'emprestimo'],
    keywords: ['saldo devedor', 'quanto ainda devo', 'quanto falta pagar'],
    category: FinancialEducationCategory.DEBTS,
  },
  {
    id: 'emprestimo',
    slug: 'emprestimo',
    title: 'Empréstimo',
    shortExplanation:
      'É quando você recebe um valor em dinheiro e se compromete a devolvê-lo, geralmente com juros, em parcelas.',
    whyItMatters:
      'Um empréstimo pode ajudar em um momento de necessidade, mas aumenta seus compromissos futuros — por isso vale entender o valor das parcelas antes de assumir.',
    relatedTopics: ['juros', 'cet', 'saldo-devedor', 'amortizacao'],
    keywords: ['emprestimo', 'pegar dinheiro emprestado', 'credito pessoal'],
    category: FinancialEducationCategory.LOANS,
  },
  {
    id: 'financiamento',
    slug: 'financiamento',
    title: 'Financiamento',
    shortExplanation:
      'É um empréstimo com uma finalidade específica, como comprar um carro ou um imóvel, geralmente com prazos mais longos.',
    whyItMatters:
      'Financiamentos costumam durar anos, então pequenas diferenças na taxa de juros podem representar valores altos no total pago.',
    relatedTopics: ['emprestimo', 'cet', 'amortizacao'],
    keywords: ['financiamento', 'financiar carro', 'financiar imovel', 'financiar casa'],
    category: FinancialEducationCategory.LOANS,
  },
  {
    id: 'amortizacao',
    slug: 'amortizacao',
    title: 'Amortização',
    shortExplanation: 'Amortizar é diminuir o valor que você ainda deve.',
    whyItMatters:
      'Quando você paga uma parcela de um empréstimo, uma parte pode reduzir a dívida e outra parte pode pagar juros. Entender isso ajuda a saber por que a dívida às vezes cai devagar.',
    relatedTopics: ['saldo-devedor', 'juros-ao-mes', 'emprestimo'],
    keywords: ['amortizacao', 'amortizar', 'reduzir a divida', 'abater a divida'],
    category: FinancialEducationCategory.DEBTS,
  },
  {
    id: 'conta-vencida',
    slug: 'conta-vencida',
    title: 'Conta vencida',
    shortExplanation: 'É uma conta cuja data de pagamento já passou sem que ela tenha sido paga.',
    whyItMatters:
      'Contas vencidas podem gerar multa, juros ou negativação, e merecem atenção prioritária no seu planejamento.',
    relatedTopics: ['despesa-essencial', 'negociacao-divida'],
    keywords: ['conta vencida', 'conta atrasada', 'nao paguei a conta'],
    category: FinancialEducationCategory.DAILY_ACCOUNTS,
  },
  {
    id: 'negociacao-divida',
    slug: 'negociacao-divida',
    title: 'Negociação de dívida',
    shortExplanation: 'É conversar com quem você deve para tentar ajustar valores, prazos ou condições de pagamento.',
    whyItMatters:
      'Negociar pode ajudar a organizar uma dívida difícil de pagar no formato original, evitando que ela cresça ainda mais.',
    relatedTopics: ['saldo-devedor', 'conta-vencida'],
    keywords: ['negociar divida', 'renegociar divida', 'acordo de divida', 'parcelar divida atrasada'],
    category: FinancialEducationCategory.DEBTS,
  },
  {
    id: 'renda',
    slug: 'renda',
    title: 'Renda',
    shortExplanation: 'É o dinheiro que entra para você em um período, como salário, freelas ou outras fontes.',
    whyItMatters:
      'Conhecer sua renda é o primeiro passo para saber quanto você pode comprometer com contas, dívidas e reservas.',
    relatedTopics: ['renda-comprometida', 'orcamento'],
    keywords: ['renda', 'quanto eu ganho', 'salario', 'dinheiro que entra'],
    category: FinancialEducationCategory.ORGANIZATION,
  },
  {
    id: 'renda-comprometida',
    slug: 'renda-comprometida',
    title: 'Renda comprometida',
    shortExplanation: 'É a parte da sua renda que já está reservada para pagar contas, parcelas ou dívidas.',
    whyItMatters: 'Quanto mais renda comprometida, menos espaço sobra para imprevistos ou novos gastos.',
    example: 'Se você ganha R$ 4.000 e tem R$ 2.800 em contas e parcelas fixas, sua renda comprometida é de R$ 2.800.',
    relatedTopics: ['renda', 'orcamento', 'valor-realmente-disponivel'],
    keywords: ['renda comprometida', 'quanto da minha renda ja esta gasto', 'parcelas comprometem a renda'],
    category: FinancialEducationCategory.ORGANIZATION,
  },
  {
    id: 'despesa-fixa',
    slug: 'despesa-fixa',
    title: 'Despesa fixa',
    shortExplanation: 'É um gasto que se repete todo mês, geralmente com valor parecido, como aluguel ou internet.',
    whyItMatters: 'Conhecer suas despesas fixas ajuda a montar um orçamento mais previsível.',
    relatedTopics: ['despesa-variavel', 'despesa-essencial', 'orcamento'],
    keywords: ['despesa fixa', 'gasto fixo', 'conta que se repete todo mes'],
    category: FinancialEducationCategory.ORGANIZATION,
  },
  {
    id: 'despesa-variavel',
    slug: 'despesa-variavel',
    title: 'Despesa variável',
    shortExplanation: 'É um gasto que muda de valor de um mês para outro, como lazer ou compras do dia a dia.',
    whyItMatters:
      'Despesas variáveis costumam ser onde há mais espaço para ajustar o orçamento quando o mês fica apertado.',
    relatedTopics: ['despesa-fixa', 'orcamento'],
    keywords: ['despesa variavel', 'gasto variavel', 'gasto que muda todo mes'],
    category: FinancialEducationCategory.ORGANIZATION,
  },
  {
    id: 'despesa-essencial',
    slug: 'despesa-essencial',
    title: 'Despesa essencial',
    shortExplanation: 'É um gasto necessário para o básico do dia a dia, como moradia, alimentação e saúde.',
    whyItMatters:
      'Identificar despesas essenciais ajuda a priorizar o que precisa ser pago primeiro quando o dinheiro está curto.',
    relatedTopics: ['despesa-fixa', 'conta-vencida', 'orcamento'],
    keywords: ['despesa essencial', 'gasto essencial', 'conta que nao pode faltar', 'gasto prioritario'],
    category: FinancialEducationCategory.ORGANIZATION,
  },
  {
    id: 'reserva-emergencia',
    slug: 'reserva-emergencia',
    title: 'Reserva de emergência',
    shortExplanation: 'É um valor guardado para imprevistos, como uma despesa inesperada ou queda de renda.',
    whyItMatters: 'Ter uma reserva ajuda a evitar novas dívidas quando algo inesperado acontece.',
    relatedTopics: ['orcamento', 'valor-realmente-disponivel'],
    keywords: ['reserva de emergencia', 'reserva financeira', 'dinheiro guardado', 'poupanca para imprevistos'],
    category: FinancialEducationCategory.SAVINGS_AND_SECURITY,
  },
  {
    id: 'orcamento',
    slug: 'orcamento',
    title: 'Orçamento',
    shortExplanation: 'É um plano de quanto você espera receber e gastar em um período, geralmente um mês.',
    whyItMatters: 'Um orçamento ajuda a organizar receitas, despesas e reservas antes que o dinheiro acabe.',
    relatedTopics: ['renda', 'despesa-fixa', 'despesa-variavel', 'reserva-emergencia'],
    keywords: ['orcamento', 'planejamento financeiro', 'planejar os gastos do mes'],
    category: FinancialEducationCategory.ORGANIZATION,
  },
  {
    id: 'saldo-disponivel',
    slug: 'saldo-disponivel',
    title: 'Saldo disponível',
    shortExplanation: 'É o valor que aparece na sua conta neste momento.',
    whyItMatters:
      'O saldo disponível não considera contas que ainda vão ser cobradas nem valores já reservados para outros fins — por isso pode ser diferente do que você realmente pode gastar.',
    relatedTopics: ['valor-realmente-disponivel', 'reserva-emergencia'],
    keywords: ['saldo disponivel', 'saldo da conta', 'quanto tenho na conta'],
    category: FinancialEducationCategory.DAILY_ACCOUNTS,
  },
  {
    id: 'valor-realmente-disponivel',
    slug: 'valor-realmente-disponivel',
    title: 'Valor realmente disponível',
    shortExplanation: 'O saldo da sua conta não é necessariamente todo dinheiro livre para gastar.',
    whyItMatters:
      'O Prumo calcula o valor realmente disponível descontando do saldo da conta as despesas pendentes, as parcelas de dívidas e a reserva planejada. Esse cálculo depende dos dados cadastrados no Prumo.',
    example:
      'Você tem R$ 2.000 na conta. Ainda precisa pagar R$ 1.200 em contas. Você separou R$ 300 para sua reserva. Então, aproximadamente R$ 500 estão realmente disponíveis.',
    relatedTopics: ['saldo-disponivel', 'renda-comprometida', 'reserva-emergencia', 'orcamento'],
    keywords: [
      'valor realmente disponivel',
      'quanto posso gastar',
      'quanto sobra de verdade',
      'quanto tenho de verdade',
      'posso gastar quanto',
    ],
    category: FinancialEducationCategory.DAILY_ACCOUNTS,
  },
  {
    id: 'estrategia-dividas-mais-caras',
    slug: 'dividas-mais-caras-primeiro',
    title: 'Pagar primeiro as dívidas mais caras',
    shortExplanation:
      'É priorizar o pagamento das dívidas com os juros conhecidos mais altos, para reduzir o quanto os juros pesam no total.',
    whyItMatters:
      'Concentrar o pagamento nas dívidas mais caras primeiro tende a reduzir o valor total pago em juros ao longo do tempo. Essa estratégia também é conhecida tecnicamente como "avalanche". Não é uma recomendação única para todas as pessoas — cada situação é diferente.',
    relatedTopics: ['estrategia-menores-dividas', 'juros-ao-mes', 'saldo-devedor'],
    keywords: [
      'dividas mais caras primeiro',
      'estrategia avalanche',
      'avalanche',
      'pagar a divida com mais juros primeiro',
      'qual divida pagar primeiro',
    ],
    category: FinancialEducationCategory.DEBTS,
  },
  {
    id: 'estrategia-menores-dividas',
    slug: 'menores-dividas-primeiro',
    title: 'Eliminar primeiro as menores dívidas',
    shortExplanation:
      'É priorizar a quitação das dívidas com menor saldo, para reduzir mais rápido a quantidade de dívidas em aberto.',
    whyItMatters:
      'Ver dívidas sendo quitadas por completo pode ajudar a manter o ânimo em um plano de longo prazo. Essa estratégia também é conhecida tecnicamente como "snowball". Não é uma recomendação única para todas as pessoas — cada situação é diferente.',
    relatedTopics: ['estrategia-dividas-mais-caras', 'saldo-devedor'],
    keywords: [
      'menores dividas primeiro',
      'estrategia snowball',
      'snowball',
      'pagar a divida menor primeiro',
      'quitar dividas pequenas primeiro',
    ],
    category: FinancialEducationCategory.DEBTS,
  },
];
