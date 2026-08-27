import { IsoMonthString } from './common.model';

/**
 * Estratégias disponíveis em "Meu Caminho" para priorizar a quitação de
 * dívidas.
 */
export enum DebtPayoffStrategyType {
  /** Pagar primeiro as dívidas mais caras (maiores juros). */
  AVALANCHE = 'AVALANCHE',
  /** Eliminar primeiro as menores dívidas. */
  SNOWBALL = 'SNOWBALL',
}

/**
 * Posição de uma dívida específica dentro do plano sugerido.
 */
export interface PayoffPlanStep {
  debtId: string;
  /** Ordem sugerida de quitação (1 = primeira a ser priorizada). */
  order: number;
  estimatedPayoffMonth?: IsoMonthString;
}

/**
 * Simulação de um plano de quitação de dívidas ("Meu Caminho").
 *
 * `estimatedInterestPaid` só deve ser preenchido quando houver dados
 * suficientes (taxas de juros conhecidas) para uma estimativa segura. Nunca
 * deve ser inventado.
 */
export interface PayoffSimulation {
  strategy: DebtPayoffStrategyType;
  /** Nome simples da estratégia, em linguagem comum (ex.: "Pagar primeiro as dívidas mais caras"). */
  title: string;
  /** Nome técnico, mostrado apenas secundariamente (ex.: "estratégia avalanche"). */
  technicalName: string;
  /** Total atual das dívidas consideradas no plano. */
  totalDebtAmount: number;
  /** Quanto já foi eliminado até o momento. */
  totalEliminated: number;
  /** Valor mensal disponível para pagamento de dívidas. */
  monthlyAvailableForPayoff: number;
  steps: PayoffPlanStep[];
  estimatedMonthsToPayoff?: number;
  /**
   * Só é preenchido quando todas as dívidas consideradas possuem taxa de
   * juros conhecida. Nunca deve ser inventado.
   */
  estimatedInterestPaid?: number;
  /** `true` quando alguma dívida do plano não tem taxa de juros conhecida. */
  hasUnknownInterestRate: boolean;
}

/**
 * Progresso geral das dívidas consideradas no plano, independente da
 * estratégia escolhida (usado na barra de progresso "Você começou com...").
 */
export interface PayoffPlanProgress {
  /** Soma dos valores originais das dívidas (o quanto o usuário começou devendo). */
  totalOriginalAmount: number;
  /** Soma dos saldos atuais das dívidas ativas (o quanto ainda deve hoje). */
  totalCurrentBalance: number;
  /** Quanto já foi eliminado (diferença entre original e saldo atual). */
  totalEliminated: number;
}

/**
 * O Prumo não inventa um plano quando não há dívidas ativas ou dados
 * suficientes (ex.: nenhum valor mensal disponível para pagamento).
 */
export interface PayoffPlanInsufficientData {
  message: string;
  hint?: string;
}

/** Resultado completo de "Meu Caminho": progresso geral + uma simulação por estratégia. */
export interface PayoffPlanResult {
  progress: PayoffPlanProgress;
  simulations: PayoffSimulation[];
}

/** Saída do plano de quitação: ou um resultado com as estratégias, ou um aviso de dados insuficientes. */
export type PayoffPlanOutput =
  | { status: 'OK'; result: PayoffPlanResult }
  | { status: 'INSUFFICIENT_DATA'; missingData: PayoffPlanInsufficientData };
