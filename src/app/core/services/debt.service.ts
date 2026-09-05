import { Observable } from 'rxjs';
import { Debt, DebtStatus, DebtType, IsoDateString } from '../models';
import { CrudService } from './crud.service';

/**
 * Contrato de criação alinhado ao backend: os mesmos campos de `Debt`,
 * exceto `id` e os campos somente de resposta (`createdAt`/`updatedAt`).
 * Explícito (em vez de `Omit<Debt, 'id'>`) para nunca deixar
 * `createdAt`/`updatedAt` vazarem para dentro do payload de escrita.
 */
export interface CreateDebtInput {
  creditor: string;
  description: string;
  type: DebtType;
  originalAmount: number;
  currentBalance: number;
  interestRateMonthly?: number;
  minimumPayment?: number;
  installmentAmount?: number;
  totalInstallments?: number;
  remainingInstallments?: number;
  dueDay: number;
  startDate: IsoDateString;
  status: DebtStatus;
}

/**
 * Contrato de atualização: os mesmos campos de criação, parciais para
 * permitir chamadas parciais da UI/`LocalDebtService`. `HttpDebtService` é
 * responsável por montar o PUT completo esperado pelo backend.
 */
export type UpdateDebtInput = Partial<CreateDebtInput>;

/**
 * Filtros aceitos por `DebtService.getAll`, espelhando os filtros de
 * consulta do backend (`status`, `type`, `creditor`, `dueDay`). `creditor` é
 * uma busca parcial e case-insensitive; `dueDay` é comparação exata. Este
 * contrato é específico de `DebtService` — `CrudService` genérico
 * permanece sem filtros.
 */
export interface DebtFilters {
  status?: DebtStatus;
  type?: DebtType;
  creditor?: string;
  dueDay?: number;
}

/** Contrato de acesso às dívidas do usuário. */
export abstract class DebtService extends CrudService<Debt, CreateDebtInput, UpdateDebtInput> {
  abstract override getAll(filters?: DebtFilters): Observable<Debt[]>;
}
