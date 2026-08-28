import { Observable } from 'rxjs';
import { Income, IsoDateString } from '../models';
import { CrudService } from './crud.service';

/**
 * Contrato de criação alinhado ao backend: `accountId`, `categoryId`,
 * `description`, `amount`, `incomeDate`, `recurring`. Explícito (em vez de
 * `Omit<Income, 'id'>`) para nunca carregar campos somente de resposta
 * (`createdAt`/`updatedAt`) para dentro do payload de escrita.
 */
export interface CreateIncomeInput {
  accountId: string;
  categoryId: string;
  description: string;
  amount: number;
  incomeDate: IsoDateString;
  recurring: boolean;
}

/**
 * Contrato de atualização: os mesmos campos de criação, parciais para
 * permitir chamadas parciais da UI/`LocalIncomeService`. `HttpIncomeService`
 * é responsável por montar o PUT completo esperado pelo backend.
 */
export type UpdateIncomeInput = Partial<CreateIncomeInput>;

/**
 * Filtros aceitos por `IncomeService.getAll`, espelhando os filtros de
 * consulta do backend (`accountId`, `categoryId`, `recurring`, `from`,
 * `to`). Período `from`/`to` é inclusivo. Este contrato é específico de
 * `IncomeService` — `CrudService` genérico permanece sem filtros.
 */
export interface IncomeFilters {
  accountId?: string;
  categoryId?: string;
  recurring?: boolean;
  from?: IsoDateString;
  to?: IsoDateString;
}

/** Contrato de acesso às receitas cadastradas pelo usuário. */
export abstract class IncomeService extends CrudService<
  Income,
  CreateIncomeInput,
  UpdateIncomeInput
> {
  abstract override getAll(filters?: IncomeFilters): Observable<Income[]>;
}
