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

/**
 * Filtros aceitos por `CreditCardPurchaseService.getAll`, espelhando
 * exatamente os parâmetros de consulta reais do backend
 * (`GET /credit-card-purchases`). Nenhum campo inventado (sem `status`,
 * `description`, `invoiceId` ou `accountId` — nada disso existe no backend).
 */
export interface CreditCardPurchaseFilters {
  creditCardId?: string;
  categoryId?: string;
  installmentCount?: number;
  from?: IsoDateString;
  to?: IsoDateString;
}

/** Contrato de acesso às compras feitas em cartões de crédito. */
export abstract class CreditCardPurchaseService extends CrudService<
  CreditCardPurchase,
  CreateCreditCardPurchaseInput,
  UpdateCreditCardPurchaseInput
> {
  abstract override getAll(filters?: CreditCardPurchaseFilters): Observable<CreditCardPurchase[]>;

  /** Equivalente a `getAll({ creditCardId })` — não é um endpoint separado. */
  abstract getByCard(creditCardId: string): Observable<CreditCardPurchase[]>;
}
