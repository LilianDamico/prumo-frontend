import { Observable } from 'rxjs';
import { Expense, ExpenseStatus, IsoDateString } from '../models';
import { CrudService } from './crud.service';

/**
 * Contrato de criação alinhado ao backend: `accountId`, `categoryId`,
 * `description`, `amount`, `dueDate`, `paymentDate`, `recurring`, `status`.
 * Explícito (em vez de `Omit<Expense, 'id'>`) para nunca carregar campos
 * somente de resposta (`createdAt`/`updatedAt`) para dentro do payload de
 * escrita.
 */
export interface CreateExpenseInput {
  accountId: string;
  categoryId: string;
  description: string;
  amount: number;
  dueDate: IsoDateString;
  paymentDate: IsoDateString | null;
  recurring: boolean;
  status: ExpenseStatus;
}

/**
 * Contrato de atualização: os mesmos campos de criação, parciais para
 * permitir chamadas parciais da UI/`LocalExpenseService`. `HttpExpenseService`
 * é responsável por montar o PUT completo esperado pelo backend.
 */
export type UpdateExpenseInput = Partial<CreateExpenseInput>;

/**
 * Filtros aceitos por `ExpenseService.getAll`, espelhando os filtros de
 * consulta do backend (`accountId`, `categoryId`, `recurring`, `status`,
 * `from`, `to`). Período `from`/`to` é inclusivo. Este contrato é específico
 * de `ExpenseService` — `CrudService` genérico permanece sem filtros.
 */
export interface ExpenseFilters {
  accountId?: string;
  categoryId?: string;
  recurring?: boolean;
  status?: ExpenseStatus;
  from?: IsoDateString;
  to?: IsoDateString;
}

/** Contrato de acesso às despesas (contas a pagar) do usuário. */
export abstract class ExpenseService extends CrudService<
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput
> {
  abstract override getAll(filters?: ExpenseFilters): Observable<Expense[]>;
}
