import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Income } from '../../models';
import {
  CreateIncomeInput,
  IncomeFilters,
  IncomeService,
  UpdateIncomeInput,
} from '../income.service';

/**
 * Payload de criação/atualização enviado ao backend (`POST`/`PUT
 * /incomes`). O backend espera sempre os seis campos; por isso `update`
 * busca o registro atual antes de enviar, permitindo chamadas parciais
 * (mesmo comportamento de `HttpAccountService`/`HttpCategoryService`).
 * Nunca inclui `id`/`createdAt`/`updatedAt`.
 */
interface IncomeRequest {
  accountId: string;
  categoryId: string;
  description: string;
  amount: number;
  incomeDate: string;
  recurring: boolean;
}

/**
 * Implementação de `IncomeService` que consome a API REST do backend
 * Spring Boot (`/api/v1/incomes`). Preserva a ordenação retornada pelo
 * backend (`incomeDate DESC, createdAt DESC`) e não recalcula
 * `Account.currentBalance` — o backend é a única autoridade para o saldo.
 */
@Injectable({ providedIn: 'root' })
export class HttpIncomeService extends IncomeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/incomes`;

  override getAll(filters?: IncomeFilters): Observable<Income[]> {
    const params = this.toParams(filters);
    return this.http.get<Income[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Income | undefined> {
    return this.http.get<Income>(`${this.baseUrl}/${id}`);
  }

  create(input: CreateIncomeInput): Observable<Income> {
    const body: IncomeRequest = {
      accountId: input.accountId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      incomeDate: input.incomeDate,
      recurring: input.recurring,
    };
    return this.http.post<Income>(this.baseUrl, body);
  }

  update(id: string, changes: UpdateIncomeInput): Observable<Income> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const body: IncomeRequest = {
          accountId: changes.accountId ?? existing?.accountId ?? '',
          categoryId: changes.categoryId ?? existing?.categoryId ?? '',
          description: changes.description ?? existing?.description ?? '',
          amount: changes.amount ?? existing?.amount ?? 0,
          incomeDate: changes.incomeDate ?? existing?.incomeDate ?? '',
          recurring: changes.recurring ?? existing?.recurring ?? false,
        };
        return this.http.put<Income>(`${this.baseUrl}/${id}`, body);
      }),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /** Mapeia apenas os filtros definidos; nunca envia `undefined`/`null`. */
  private toParams(filters?: IncomeFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) {
      return params;
    }
    if (filters.accountId !== undefined) {
      params = params.set('accountId', filters.accountId);
    }
    if (filters.categoryId !== undefined) {
      params = params.set('categoryId', filters.categoryId);
    }
    if (filters.recurring !== undefined) {
      params = params.set('recurring', String(filters.recurring));
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
