import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Debt } from '../../models';
import { CreateDebtInput, DebtFilters, DebtService, UpdateDebtInput } from '../debt.service';

/**
 * Payload de criação/atualização enviado ao backend (`POST`/`PUT
 * /debts`). O backend espera sempre os treze campos de escrita; por isso
 * `update` busca o registro atual antes de enviar, permitindo chamadas
 * parciais (mesmo comportamento de `HttpAccountService`/`HttpIncomeService`/
 * `HttpExpenseService`). Nunca inclui `id`/`createdAt`/`updatedAt`. Campos
 * opcionais ausentes são enviados como `null` explícito — o formato exato
 * que os DTOs `CreateDebtRequest`/`UpdateDebtRequest` do backend aceitam
 * (não fazemos `trim()` de `creditor`/`description` aqui: o backend já
 * normaliza esses campos).
 */
interface DebtRequest {
  creditor: string;
  description: string;
  type: Debt['type'];
  originalAmount: number;
  currentBalance: number;
  interestRateMonthly: number | null;
  minimumPayment: number | null;
  installmentAmount: number | null;
  totalInstallments: number | null;
  remainingInstallments: number | null;
  dueDay: number;
  startDate: string;
  status: Debt['status'];
}

/**
 * Implementação de `DebtService` que consome a API REST do backend Spring
 * Boot (`/api/v1/debts`). Preserva a ordenação retornada pelo backend
 * (`status ASC, currentBalance DESC`) e não implementa nenhuma regra
 * financeira aqui — isso é responsabilidade de `FinancialPositionService`/
 * `PayoffPlanService`/`PurchaseSimulationService` e das validações de
 * formulário em `DebtsPage`.
 *
 * O backend aceita `dueDay`/`startDate` nulos (registros legados anteriores
 * a essa exigência), mas o contrato `Debt` do frontend os declara como
 * obrigatórios — o Prumo nunca cria uma dívida sem esses dados. Se a API
 * devolver um registro legado com `dueDay`/`startDate` nulos, este service
 * NÃO inventa um valor: o dado é repassado como veio (o valor `null`
 * atravessa o cast para `Debt`, o que é uma divergência de tipos conhecida
 * e documentada, não um bug silencioso). Ver relatório de integração para
 * detalhes.
 */
@Injectable({ providedIn: 'root' })
export class HttpDebtService extends DebtService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/debts`;

  override getAll(filters?: DebtFilters): Observable<Debt[]> {
    const params = this.toParams(filters);
    return this.http
      .get<Debt[]>(this.baseUrl, { params })
      .pipe(map((debts) => debts.map((debt) => this.normalize(debt))));
  }

  getById(id: string): Observable<Debt | undefined> {
    return this.http.get<Debt>(`${this.baseUrl}/${id}`).pipe(map((debt) => this.normalize(debt)));
  }

  create(input: CreateDebtInput): Observable<Debt> {
    const body = this.toRequest(input);
    return this.http.post<Debt>(this.baseUrl, body).pipe(map((debt) => this.normalize(debt)));
  }

  update(id: string, changes: UpdateDebtInput): Observable<Debt> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const body: DebtRequest = {
          creditor: changes.creditor ?? existing?.creditor ?? '',
          description: changes.description ?? existing?.description ?? '',
          type: changes.type ?? existing?.type ?? ('OTHER' as Debt['type']),
          originalAmount: changes.originalAmount ?? existing?.originalAmount ?? 0,
          currentBalance: changes.currentBalance ?? existing?.currentBalance ?? 0,
          interestRateMonthly: changes.interestRateMonthly ?? existing?.interestRateMonthly ?? null,
          minimumPayment: changes.minimumPayment ?? existing?.minimumPayment ?? null,
          installmentAmount: changes.installmentAmount ?? existing?.installmentAmount ?? null,
          totalInstallments: changes.totalInstallments ?? existing?.totalInstallments ?? null,
          remainingInstallments: changes.remainingInstallments ?? existing?.remainingInstallments ?? null,
          dueDay: changes.dueDay ?? existing?.dueDay ?? 1,
          startDate: changes.startDate ?? existing?.startDate ?? '',
          status: changes.status ?? existing?.status ?? ('ACTIVE' as Debt['status']),
        };
        return this.http.put<Debt>(`${this.baseUrl}/${id}`, body);
      }),
      map((debt) => this.normalize(debt)),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /** Monta o payload de escrita a partir de `CreateDebtInput`, sempre enviando `null` explícito para opcionais ausentes. */
  private toRequest(input: CreateDebtInput): DebtRequest {
    return {
      creditor: input.creditor,
      description: input.description,
      type: input.type,
      originalAmount: input.originalAmount,
      currentBalance: input.currentBalance,
      interestRateMonthly: input.interestRateMonthly ?? null,
      minimumPayment: input.minimumPayment ?? null,
      installmentAmount: input.installmentAmount ?? null,
      totalInstallments: input.totalInstallments ?? null,
      remainingInstallments: input.remainingInstallments ?? null,
      dueDay: input.dueDay,
      startDate: input.startDate,
      status: input.status,
    };
  }

  /**
   * Normaliza `null` do backend para `undefined` nos campos opcionais do
   * domínio frontend (`interestRateMonthly`, `minimumPayment`,
   * `installmentAmount`, `totalInstallments`, `remainingInstallments`).
   * `dueDay`/`startDate` são deliberadamente preservados como vieram (sem
   * inventar valor): ver nota da classe sobre registros legados.
   */
  private normalize(debt: Debt): Debt {
    return {
      ...debt,
      interestRateMonthly: debt.interestRateMonthly ?? undefined,
      minimumPayment: debt.minimumPayment ?? undefined,
      installmentAmount: debt.installmentAmount ?? undefined,
      totalInstallments: debt.totalInstallments ?? undefined,
      remainingInstallments: debt.remainingInstallments ?? undefined,
    };
  }

  /** Mapeia apenas os filtros definidos; nunca envia `undefined`/`null`. */
  private toParams(filters?: DebtFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) {
      return params;
    }
    if (filters.status !== undefined) {
      params = params.set('status', filters.status);
    }
    if (filters.type !== undefined) {
      params = params.set('type', filters.type);
    }
    if (filters.creditor !== undefined) {
      params = params.set('creditor', filters.creditor);
    }
    if (filters.dueDay !== undefined) {
      params = params.set('dueDay', String(filters.dueDay));
    }
    return params;
  }
}
