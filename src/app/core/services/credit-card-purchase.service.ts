import { Observable } from 'rxjs';
import { CreditCardPurchase } from '../models';
import { CrudService } from './crud.service';

export type CreateCreditCardPurchaseInput = Omit<CreditCardPurchase, 'id'>;
export type UpdateCreditCardPurchaseInput = Partial<CreateCreditCardPurchaseInput>;

/** Contrato de acesso às compras feitas em cartões de crédito. */
export abstract class CreditCardPurchaseService extends CrudService<
  CreditCardPurchase,
  CreateCreditCardPurchaseInput,
  UpdateCreditCardPurchaseInput
> {
  abstract getByCard(creditCardId: string): Observable<CreditCardPurchase[]>;
}
