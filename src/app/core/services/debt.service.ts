import { Debt } from '../models';
import { CrudService } from './crud.service';

export type CreateDebtInput = Omit<Debt, 'id'>;
export type UpdateDebtInput = Partial<CreateDebtInput>;

/** Contrato de acesso às dívidas do usuário. */
export abstract class DebtService extends CrudService<Debt, CreateDebtInput, UpdateDebtInput> {}
