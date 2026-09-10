import { Observable } from 'rxjs';
import { CreditCard } from '../models';
import { CrudService } from './crud.service';

/**
 * Contrato de criação alinhado ao backend: os mesmos campos de `CreditCard`,
 * exceto `id` e os campos somente de resposta (`createdAt`/`updatedAt`).
 * Explícito (em vez de `Omit<CreditCard, 'id'>`) para nunca deixar
 * `createdAt`/`updatedAt` vazarem para dentro do payload de escrita.
 */
export interface CreateCreditCardInput {
  name: string;
  institution: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  active: boolean;
}

/**
 * Contrato de atualização: os mesmos campos de criação, parciais para
 * permitir chamadas parciais da UI/`LocalCreditCardService`.
 * `HttpCreditCardService` é responsável por montar o PUT completo esperado
 * pelo backend.
 */
export type UpdateCreditCardInput = Partial<CreateCreditCardInput>;

/**
 * Filtros aceitos por `CreditCardService.getAll`, espelhando o único filtro
 * de consulta do backend (`active`). Este contrato é específico de
 * `CreditCardService` — `CrudService` genérico permanece sem filtros.
 */
export interface CreditCardFilters {
  active?: boolean;
}

/** Contrato de acesso aos cartões de crédito do usuário. */
export abstract class CreditCardService extends CrudService<
  CreditCard,
  CreateCreditCardInput,
  UpdateCreditCardInput
> {
  abstract override getAll(filters?: CreditCardFilters): Observable<CreditCard[]>;
}
