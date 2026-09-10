import { Observable } from 'rxjs';
import { CreditCardPurchase, IsoDateString } from '../models';
import { CrudService } from './crud.service';

/**
 * Contrato de criação alinhado ao backend: nunca inclui `id`, `installmentAmount`
 * (somente-resposta, calculado pelo backend) nem `createdAt`/`updatedAt`.
 */
export interface CreateCreditCardPurchaseInput {
  creditCardId: string;
  categoryId: string;
  description: string;
  purchaseDate: IsoDateString;
  totalAmount: number;
  installmentCount: number;
}

export type UpdateCreditCardPurchaseInput = Partial<CreateCreditCardPurchaseInput>;

/** Contrato de acesso às compras feitas em cartões de crédito. */
export abstract class CreditCardPurchaseService extends CrudService<
  CreditCardPurchase,
  CreateCreditCardPurchaseInput,
  UpdateCreditCardPurchaseInput
> {
  abstract getByCard(creditCardId: string): Observable<CreditCardPurchase[]>;
}
