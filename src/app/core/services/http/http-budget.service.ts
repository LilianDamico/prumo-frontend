import { HttpClient, HttpContext, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';

import { SKIP_NOT_FOUND_NOTIFICATION } from '../../interceptors/http-context-tokens';
import { API_BASE_URL } from '../../config/api.config';
import { IsoMonthString, MonthlyBudget } from '../../models';
import {
  BudgetFilters,
  BudgetService,
  CreateMonthlyBudgetInput,
  UpdateMonthlyBudgetInput,
} from '../budget.service';

/**
 * Payload de criação/atualização enviado ao backend (`POST`/`PUT
 * /budgets`). O backend espera sempre os cinco campos de escrita; por isso
 * `update` busca o registro atual antes de enviar, permitindo chamadas
 * parciais (mesmo comportamento de `HttpDebtService`/`HttpCategoryService`).
 * Nunca inclui `id`/`createdAt`/`updatedAt`.
 */
interface BudgetRequest {
  referenceMonth: IsoMonthString;
  expectedIncome: number;
  maximumExpenses: number;
  debtPaymentTarget: number;
  emergencyReserveTarget: number;
}

/**
 * Implementação de `BudgetService` que consome a API REST do backend
 * Spring Boot (`/api/v1/budgets`). Frontend e backend já usam os mesmos
 * nomes de campo (`expectedIncome`/`maximumExpenses`/`debtPaymentTarget`/
 * `emergencyReserveTarget`) e o mesmo formato textual `AAAA-MM` para
 * `referenceMonth` — por isso não há `normalize()`: a resposta do backend é
 * consumida diretamente como `MonthlyBudget`.
 *
 * `getByMonth` trata o 404 do backend (mês sem orçamento cadastrado) como
 * ausência normal (`undefined`), não como erro: a requisição usa
 * `SKIP_NOT_FOUND_NOTIFICATION` para que `httpErrorInterceptor` não dispare
 * a notificação global de erro nesse caso específico. Qualquer outro status
 * (400/409/500/rede) continua propagando normalmente. `getById` NÃO usa
 * esse contexto: um 404 ali é sempre um erro real.
 */
@Injectable({ providedIn: 'root' })
export class HttpBudgetService extends BudgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/budgets`;

  getAll(filters?: BudgetFilters): Observable<MonthlyBudget[]> {
    const params = this.toParams(filters);
    return this.http.get<MonthlyBudget[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<MonthlyBudget | undefined> {
    return this.http.get<MonthlyBudget>(`${this.baseUrl}/${id}`);
  }

  getByMonth(referenceMonth: IsoMonthString): Observable<MonthlyBudget | undefined> {
    const context = new HttpContext().set(SKIP_NOT_FOUND_NOTIFICATION, true);
    return this.http.get<MonthlyBudget>(`${this.baseUrl}/by-month/${referenceMonth}`, { context }).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(undefined);
        }
        return throwError(() => error);
      }),
    );
  }

  create(input: CreateMonthlyBudgetInput): Observable<MonthlyBudget> {
    const body = this.toRequest(input);
    return this.http.post<MonthlyBudget>(this.baseUrl, body);
  }

  update(id: string, changes: UpdateMonthlyBudgetInput): Observable<MonthlyBudget> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const body: BudgetRequest = {
          referenceMonth: changes.referenceMonth ?? existing?.referenceMonth ?? '',
          expectedIncome: changes.expectedIncome ?? existing?.expectedIncome ?? 0,
          maximumExpenses: changes.maximumExpenses ?? existing?.maximumExpenses ?? 0,
          debtPaymentTarget: changes.debtPaymentTarget ?? existing?.debtPaymentTarget ?? 0,
          emergencyReserveTarget: changes.emergencyReserveTarget ?? existing?.emergencyReserveTarget ?? 0,
        };
        return this.http.put<MonthlyBudget>(`${this.baseUrl}/${id}`, body);
      }),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /** Monta o payload de escrita a partir de `CreateMonthlyBudgetInput`. */
  private toRequest(input: CreateMonthlyBudgetInput): BudgetRequest {
    return {
      referenceMonth: input.referenceMonth,
      expectedIncome: input.expectedIncome,
      maximumExpenses: input.maximumExpenses,
      debtPaymentTarget: input.debtPaymentTarget,
      emergencyReserveTarget: input.emergencyReserveTarget,
    };
  }

  /** Mapeia apenas os filtros definidos; nunca envia `undefined`/`null`. */
  private toParams(filters?: BudgetFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) {
      return params;
    }
    if (filters.from !== undefined) {
      params = params.set('from', filters.from);
    }
    if (filters.to !== undefined) {
      params = params.set('to', filters.to);
    }
    return params;
  }
}
