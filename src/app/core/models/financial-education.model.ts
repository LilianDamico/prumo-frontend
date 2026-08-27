/**
 * Categoria de um conceito financeiro em "Me explica". Os rótulos exibidos
 * ao usuário vêm de `FINANCIAL_EDUCATION_CATEGORY_LABELS`
 * (`labels.util.ts`) — o valor do enum nunca aparece na tela.
 */
export enum FinancialEducationCategory {
  DAILY_ACCOUNTS = 'DAILY_ACCOUNTS',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBTS = 'DEBTS',
  LOANS = 'LOANS',
  ORGANIZATION = 'ORGANIZATION',
  SAVINGS_AND_SECURITY = 'SAVINGS_AND_SECURITY',
}

/**
 * Conceito financeiro explicado em português simples. Fonte única de
 * conteúdo para "Me explica" e para as explicações contextuais
 * (`InfoExplanation`) espalhadas pelas outras telas — nenhum texto
 * explicativo deve ser duplicado em outro arquivo.
 */
export interface FinancialEducationTopic {
  readonly id: string;
  /** Identificador amigável usado em navegação/URLs (ex.: "juros-ao-mes"). */
  readonly slug: string;
  title: string;
  /** Resposta curta para "O que é?", mostrada no card de listagem. */
  shortExplanation: string;
  /** Resposta para "Por que isso importa?". */
  whyItMatters: string;
  /** Exemplo em reais, quando aplicável ao conceito. */
  example?: string;
  /** Ids de outros tópicos relacionados (`FinancialEducationTopic.id`). */
  relatedTopics: string[];
  /** Palavras e expressões (inclusive populares) usadas na busca. */
  keywords: string[];
  category: FinancialEducationCategory;
}
