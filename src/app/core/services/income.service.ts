import { Income } from '../models';
import { CrudService } from './crud.service';

export type CreateIncomeInput = Omit<Income, 'id'>;
export type UpdateIncomeInput = Partial<CreateIncomeInput>;

/** Contrato de acesso às receitas cadastradas pelo usuário. */
export abstract class IncomeService extends CrudService<
  Income,
  CreateIncomeInput,
  UpdateIncomeInput
> {}
