import { Expense } from '../models';
import { CrudService } from './crud.service';

export type CreateExpenseInput = Omit<Expense, 'id'>;
export type UpdateExpenseInput = Partial<CreateExpenseInput>;

/** Contrato de acesso às despesas (contas a pagar) do usuário. */
export abstract class ExpenseService extends CrudService<
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput
> {}
