import { IsoMonthString } from './common.model';

/**
 * Estado geral das contas do usuário em um mês, calculado pelo
 * `FinancialPositionService`. Sempre acompanhado de uma explicação em texto
 * simples — nunca depende apenas de cor para ser compreendido.
 */
export enum FinancialPositionStatus {
  /** Contas equilibradas. */
  NO_PRUMO = 'NO_PRUMO',
  /** Orçamento apertado, mas sob controle. */
  ATENCAO = 'ATENCAO',
  /** Despesas maiores que a renda. */
  APERTO = 'APERTO',
  /** Contas essenciais ou dívidas em risco de atraso. */
  URGENTE = 'URGENTE',
}

/**
 * Posição financeira do usuário em um mês de referência. Reúne os números
 * necessários para responder, de forma simples, "quanto sobra de verdade".
 */
export interface FinancialPosition {
  referenceMonth: IsoMonthString;
  /** Quanto entrou no mês. */
  totalIncome: number;
  /** Quanto já saiu (despesas pagas). */
  totalPaidExpenses: number;
  /** Quanto ainda vai sair (despesas pendentes do período). */
  totalPendingExpenses: number;
  /** Parcelas obrigatórias do período (dívidas, cartão, financiamentos). */
  totalMandatoryInstallments: number;
  /** Reserva planejada para o mês. */
  plannedReserve: number;
  /**
   * "Quanto você pode usar": saldo atual das contas, menos despesas
   * pendentes, menos parcelas obrigatórias, menos reserva planejada.
   */
  availableAmount: number;
  status: FinancialPositionStatus;
}
