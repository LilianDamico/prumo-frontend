import { Observable } from 'rxjs';
import { IsoMonthString, MonthlyBudget } from '../models';
import { CrudService } from './crud.service';

export type CreateMonthlyBudgetInput = Omit<MonthlyBudget, 'id'>;
export type UpdateMonthlyBudgetInput = Partial<CreateMonthlyBudgetInput>;

/** Contrato de acesso ao planejamento financeiro mensal do usuário. */
export abstract class BudgetService extends CrudService<
  MonthlyBudget,
  CreateMonthlyBudgetInput,
  UpdateMonthlyBudgetInput
> {
  abstract getByMonth(referenceMonth: IsoMonthString): Observable<MonthlyBudget | undefined>;
}
