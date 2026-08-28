import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Expense, ExpenseStatus } from '../../models';
import {
  CreateExpenseInput,
  ExpenseFilters,
  ExpenseService,
  UpdateExpenseInput,
} from '../expense.service';

/**
 * Payload de criação/atualização enviado ao backend (`POST`/`PUT
 * /expenses`). O backend espera sempre os oito campos; por isso `update`
 * busca o registro atual antes de enviar, permitindo chamadas parciais
 * (mesmo comportamento de `HttpAccountService`/`HttpCategoryService`/
 * `HttpIncomeService`). Nunca inclui `id`/`createdAt`/`updatedAt`/`essential`.
 * `paymentDate` é sempre enviado explicitamente (podendo ser `null`).
 */
interface ExpenseRequest {
  accountId: string;
  categoryId: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate: string | null;
  recurring: boolean;
  status: Expense['status'];
}

/**
 * Implementação de `ExpenseService` que consome a API REST do backend
 * Spring Boot (`/api/v1/expenses`). Preserva a ordenação retornada pelo
 * backend (`dueDate ASC, createdAt ASC`) e não recalcula
 * `Account.currentBalance` — o backend é a única autoridade para o saldo.
 */
@Injectable({ providedIn: 'root' })
export class HttpExpenseService extends ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/expenses`;

  override getAll(filters?: ExpenseFilters): Observable<Expense[]> {
    const params = this.toParams(filters);
    return this.http.get<Expense[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Expense | undefined> {
    return this.http.get<Expense>(`${this.baseUrl}/${id}`);
  }

  create(input: CreateExpenseInput): Observable<Expense> {
    const body: ExpenseRequest = {
      accountId: input.accountId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      dueDate: input.dueDate,
      paymentDate: input.paymentDate,
      recurring: input.recurring,
      status: input.status,
    };
    return this.http.post<Expense>(this.baseUrl, body);
  }

  update(id: string, changes: UpdateExpenseInput): Observable<Expense> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const body: ExpenseRequest = {
          accountId: changes.accountId ?? existing?.accountId ?? '',
          categoryId: changes.categoryId ?? existing?.categoryId ?? '',
          description: changes.description ?? existing?.description ?? '',
          amount: changes.amount ?? existing?.amount ?? 0,
          dueDate: changes.dueDate ?? existing?.dueDate ?? '',
          paymentDate:
            changes.paymentDate !== undefined ? changes.paymentDate : (existing?.paymentDate ?? null),
          recurring: changes.recurring ?? existing?.recurring ?? false,
          status: changes.status ?? existing?.status ?? ExpenseStatus.PENDING,
        };
        return this.http.put<Expense>(`${this.baseUrl}/${id}`, body);
      }),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /** Mapeia apenas os filtros definidos; nunca envia `undefined`/`null`. */
  private toParams(filters?: ExpenseFilters): HttpParams {
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
    if (filters.status !== undefined) {
      params = params.set('status', filters.status);
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
