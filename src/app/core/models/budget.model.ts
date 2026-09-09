import { IsoMonthString } from './common.model';

/**
 * Planejamento financeiro de um mês específico: quanto o usuário espera
 * receber, o teto de gastos, a meta de pagamento de dívidas e quanto
 * deseja guardar de reserva de emergência. Espelha o contrato do backend
 * (`Budget`), incluindo `createdAt`/`updatedAt`, que só existem depois que
 * o registro é persistido.
 */
export interface MonthlyBudget {
  readonly id: string;
  referenceMonth: IsoMonthString;
  expectedIncome: number;
  maximumExpenses: number;
  /** Meta mensal de pagamento de dívidas. Ainda não entra em nenhum cálculo. */
  debtPaymentTarget: number;
  emergencyReserveTarget: number;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
