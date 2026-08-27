import { IsoMonthString } from './common.model';

/**
 * Resultado de uma simulação de compra ("Posso comprar?"). O Prumo nunca
 * responde apenas "sim" ou "não": mostra o impacto e deixa a decisão com o
 * usuário.
 */
export enum PurchaseSimulationOutcome {
  /** A compra cabe no orçamento atual. */
  CONFORTAVEL = 'CONFORTAVEL',
  /** A compra é possível, mas deixa o orçamento apertado. */
  POSSIVEL_MAS_APERTA = 'POSSIVEL_MAS_APERTA',
  /** A compra pode fazer faltar dinheiro para contas já assumidas. */
  ALTO_RISCO = 'ALTO_RISCO',
}

/** Forma de pagamento escolhida para a compra simulada. */
export enum PurchasePaymentMethod {
  CASH = 'CASH',
  INSTALLMENTS = 'INSTALLMENTS',
}

/** Dados informados pelo usuário para simular uma compra. */
export interface PurchaseSimulationRequest {
  amount: number;
  paymentMethod: PurchasePaymentMethod;
  /** Ignorado (tratado como 1) quando `paymentMethod` é `CASH`. */
  installmentsCount: number;
  firstChargeMonth: IsoMonthString;
}

/**
 * Impacto projetado da compra em um mês específico. Todos os valores são
 * previsões (renda e compromissos já conhecidos pelo Prumo), não um saldo de
 * caixa acumulado entre meses.
 */
export interface PurchaseSimulationMonthImpact {
  referenceMonth: IsoMonthString;
  /** Receitas previstas para o mês (recorrentes e já cadastradas). */
  projectedIncome: number;
  /** Compromissos previstos para o mês (despesas, dívidas, reserva). */
  projectedCommitments: number;
  /** Parcela (ou valor integral, se à vista) da compra simulada neste mês. */
  purchaseAmount: number;
  /** Quanto deve sobrar no mês, sem considerar a nova compra. */
  projectedAvailableBeforePurchase: number;
  /** Quanto deve sobrar no mês, já considerando a nova compra. */
  projectedAvailableAfterPurchase: number;
}

/** Resultado completo de uma simulação de compra bem-sucedida. */
export interface PurchaseSimulationResult {
  request: PurchaseSimulationRequest;
  monthlyImpact: PurchaseSimulationMonthImpact[];
  /** O mês em que a compra deixa menos dinheiro disponível. */
  tightestMonth: PurchaseSimulationMonthImpact;
  outcome: PurchaseSimulationOutcome;
}

/**
 * O Prumo nunca inventa números: quando faltam dados essenciais (ex.: renda
 * cadastrada) para uma projeção confiável, a simulação retorna este estado
 * em vez de um resultado numérico.
 */
export interface PurchaseSimulationInsufficientData {
  message: string;
  hint?: string;
}

/** Saída da simulação: ou um resultado numérico, ou um aviso de dados insuficientes. */
export type PurchaseSimulationOutput =
  | { status: 'OK'; result: PurchaseSimulationResult }
  | { status: 'INSUFFICIENT_DATA'; missingData: PurchaseSimulationInsufficientData };
