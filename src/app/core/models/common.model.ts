/**
 * Estratégia de datas do Prumo: todas as datas de domínio são representadas
 * como texto no formato ISO `AAAA-MM-DD` (ou `AAAA-MM` para meses de
 * referência). Isso evita ambiguidade de fuso horário do objeto `Date` do
 * JavaScript e mantém a serialização em `localStorage`/JSON simples e
 * previsível, sem depender de bibliotecas externas de data.
 */
export type IsoDateString = string;

/**
 * Mês de referência no formato `AAAA-MM`, usado por faturas, orçamentos
 * mensais e simulações.
 */
export type IsoMonthString = string;
