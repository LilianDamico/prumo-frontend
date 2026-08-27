import { IsoMonthString } from './common.model';

/**
 * Planejamento financeiro de um mês específico: quanto o usuário espera
 * receber, quanto planeja gastar e quanto deseja guardar de reserva.
 */
export interface MonthlyBudget {
  readonly id: string;
  referenceMonth: IsoMonthString;
  plannedIncome: number;
  plannedExpenses: number;
  plannedReserve: number;
}
