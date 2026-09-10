import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { CreditCard } from '../../models';
import {
  CreateCreditCardInput,
  CreditCardFilters,
  CreditCardService,
  UpdateCreditCardInput,
} from '../credit-card.service';

/**
 * Payload de criação/atualização enviado ao backend (`POST`/`PUT
 * /credit-cards`). O backend espera sempre os seis campos de escrita; por
 * isso `update` busca o registro atual antes de enviar, permitindo chamadas
 * parciais (mesmo comportamento de `HttpAccountService`/`HttpDebtService`/
 * `HttpBudgetService`). Nunca inclui `id`/`createdAt`/`updatedAt`.
 */
interface CreditCardRequest {
  name: string;
  institution: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  active: boolean;
}

/**
 * Implementação de `CreditCardService` que consome a API REST do backend
 * Spring Boot (`/api/v1/credit-cards`). Frontend e backend já usam os
 * mesmos nomes de campo (`name`/`institution`/`creditLimit`/`closingDay`/
 * `dueDay`/`active`) — por isso não há `normalize()` de valores: a resposta
 * do backend é consumida diretamente como `CreditCard`. Preserva a
 * ordenação retornada pelo backend (`LOWER(name) ASC`) e não implementa
 * nenhuma regra financeira aqui (sem `availableLimit`, sem relação com
 * `Account`, sem impacto em `CreditCardPurchase`) — isso permanece fora do
 * escopo desta etapa.
 */
@Injectable({ providedIn: 'root' })
export class HttpCreditCardService extends CreditCardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/credit-cards`;

  override getAll(filters?: CreditCardFilters): Observable<CreditCard[]> {
    const params = this.toParams(filters);
    return this.http.get<CreditCard[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<CreditCard | undefined> {
    return this.http.get<CreditCard>(`${this.baseUrl}/${id}`);
  }

  create(input: CreateCreditCardInput): Observable<CreditCard> {
    const body = this.toRequest(input);
    return this.http.post<CreditCard>(this.baseUrl, body);
  }

  update(id: string, changes: UpdateCreditCardInput): Observable<CreditCard> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const body: CreditCardRequest = {
          name: changes.name ?? existing?.name ?? '',
          institution: changes.institution ?? existing?.institution ?? '',
          creditLimit: changes.creditLimit ?? existing?.creditLimit ?? 0,
          closingDay: changes.closingDay ?? existing?.closingDay ?? 1,
          dueDay: changes.dueDay ?? existing?.dueDay ?? 1,
          active: changes.active ?? existing?.active ?? true,
        };
        return this.http.put<CreditCard>(`${this.baseUrl}/${id}`, body);
      }),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /** Monta o payload de escrita a partir de `CreateCreditCardInput`. */
  private toRequest(input: CreateCreditCardInput): CreditCardRequest {
    return {
      name: input.name,
      institution: input.institution,
      creditLimit: input.creditLimit,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
      active: input.active,
    };
  }

  /**
   * Mapeia apenas o filtro `active` quando definido; `false` é um valor
   * válido e precisa ser comparado explicitamente contra `undefined` para
   * não ser omitido do query param.
   */
  private toParams(filters?: CreditCardFilters): HttpParams {
    let params = new HttpParams();
    if (filters?.active !== undefined) {
      params = params.set('active', String(filters.active));
    }
    return params;
  }
}
