import { Observable } from 'rxjs';
import { IsoMonthString, MonthlyBudget } from '../models';
import { CrudService } from './crud.service';

/**
 * Contrato de criação alinhado ao backend: os mesmos campos de
 * `MonthlyBudget`, exceto `id` e os campos somente de resposta
 * (`createdAt`/`updatedAt`). Explícito (em vez de `Omit<MonthlyBudget, 'id'>`)
 * para nunca deixar `createdAt`/`updatedAt` vazarem para dentro do payload
 * de escrita.
 */
export interface CreateMonthlyBudgetInput {
  referenceMonth: IsoMonthString;
  expectedIncome: number;
  maximumExpenses: number;
  debtPaymentTarget: number;
  emergencyReserveTarget: number;
}

export type UpdateMonthlyBudgetInput = Partial<CreateMonthlyBudgetInput>;

/**
 * Filtros aceitos por `BudgetService.getAll`, espelhando o range opcional
 * de meses aceito pelo backend (`GET /budgets?from=yyyy-MM&to=yyyy-MM`).
 * Ambos os limites são inclusivos.
 */
export interface BudgetFilters {
  from?: IsoMonthString;
  to?: IsoMonthString;
}

/** Contrato de acesso ao planejamento financeiro mensal do usuário. */
export abstract class BudgetService extends CrudService<
  MonthlyBudget,
  CreateMonthlyBudgetInput,
  UpdateMonthlyBudgetInput
> {
  abstract override getAll(filters?: BudgetFilters): Observable<MonthlyBudget[]>;
  abstract getByMonth(referenceMonth: IsoMonthString): Observable<MonthlyBudget | undefined>;
}
