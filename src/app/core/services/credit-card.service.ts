import { CreditCard } from '../models';
import { CrudService } from './crud.service';

export type CreateCreditCardInput = Omit<CreditCard, 'id'>;
export type UpdateCreditCardInput = Partial<CreateCreditCardInput>;

/** Contrato de acesso aos cartões de crédito do usuário. */
export abstract class CreditCardService extends CrudService<
  CreditCard,
  CreateCreditCardInput,
  UpdateCreditCardInput
> {}
