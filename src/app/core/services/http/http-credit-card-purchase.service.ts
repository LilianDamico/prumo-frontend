import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { CreditCardPurchase } from '../../models';
import {
  CreateCreditCardPurchaseInput,
  CreditCardPurchaseFilters,
  CreditCardPurchaseService,
  UpdateCreditCardPurchaseInput,
} from '../credit-card-purchase.service';

/**
 * Payload de criação/atualização enviado ao backend (`POST`/`PUT
 * /credit-card-purchases`). O backend espera sempre os seis campos de
 * escrita; por isso `update` busca o registro atual antes de enviar,
 * permitindo chamadas parciais (mesmo comportamento de
 * `HttpCreditCardService`/`HttpDebtService`/`HttpBudgetService`). Nunca
 * inclui `id`, `installmentAmount` (somente-resposta, calculado pelo
 * backend) nem `createdAt`/`updatedAt`.
 */
interface CreditCardPurchaseRequest {
  creditCardId: string;
  categoryId: string;
  description: string;
  purchaseDate: string;
  totalAmount: number;
  installmentCount: number;
}

/**
 * Implementação de `CreditCardPurchaseService` que consome a API REST do
 * backend Spring Boot (`/api/v1/credit-card-purchases`). Frontend e backend
 * já usam os mesmos nomes de campo — por isso não há `normalize()` de
 * valores: a resposta do backend (incluindo `installmentAmount` calculado
 * e `createdAt`/`updatedAt`) é consumida diretamente como
 * `CreditCardPurchase`. Preserva a ordenação retornada pelo backend
 * (`purchaseDate DESC, createdAt DESC`) e não implementa nenhuma regra
 * financeira nova aqui (sem fatura, sem limite disponível, sem relação com
 * `Expense`/`Account` — isso permanece fora do escopo desta etapa).
 */
@Injectable({ providedIn: 'root' })
export class HttpCreditCardPurchaseService extends CreditCardPurchaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/credit-card-purchases`;

  override getAll(filters?: CreditCardPurchaseFilters): Observable<CreditCardPurchase[]> {
    const params = this.toParams(filters);
    return this.http.get<CreditCardPurchase[]>(this.baseUrl, { params });
  }

  /** Equivalente a `getAll({ creditCardId })` — não existe endpoint dedicado no backend. */
  getByCard(creditCardId: string): Observable<CreditCardPurchase[]> {
    return this.getAll({ creditCardId });
  }

  getById(id: string): Observable<CreditCardPurchase | undefined> {
    return this.http.get<CreditCardPurchase>(`${this.baseUrl}/${id}`);
  }

  create(input: CreateCreditCardPurchaseInput): Observable<CreditCardPurchase> {
    const body = this.toRequest(input);
    return this.http.post<CreditCardPurchase>(this.baseUrl, body);
  }

  update(id: string, changes: UpdateCreditCardPurchaseInput): Observable<CreditCardPurchase> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const body: CreditCardPurchaseRequest = {
          creditCardId: changes.creditCardId ?? existing?.creditCardId ?? '',
          categoryId: changes.categoryId ?? existing?.categoryId ?? '',
          description: changes.description ?? existing?.description ?? '',
          purchaseDate: changes.purchaseDate ?? existing?.purchaseDate ?? '',
          totalAmount: changes.totalAmount ?? existing?.totalAmount ?? 0,
          installmentCount: changes.installmentCount ?? existing?.installmentCount ?? 1,
        };
        return this.http.put<CreditCardPurchase>(`${this.baseUrl}/${id}`, body);
      }),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /** Monta o payload de escrita a partir de `CreateCreditCardPurchaseInput`. */
  private toRequest(input: CreateCreditCardPurchaseInput): CreditCardPurchaseRequest {
    return {
      creditCardId: input.creditCardId,
      categoryId: input.categoryId,
      description: input.description,
      purchaseDate: input.purchaseDate,
      totalAmount: input.totalAmount,
      installmentCount: input.installmentCount,
    };
  }

  /**
   * Mapeia apenas os filtros definidos; `installmentCount` (numérico)
   * precisa ser comparado explicitamente contra `undefined` — `0` não é um
   * valor real (o backend exige 1–99), mas a checagem explícita evita
   * qualquer ambiguidade de truthiness.
   */
  private toParams(filters?: CreditCardPurchaseFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) {
      return params;
    }
    if (filters.creditCardId !== undefined) {
      params = params.set('creditCardId', filters.creditCardId);
    }
    if (filters.categoryId !== undefined) {
      params = params.set('categoryId', filters.categoryId);
    }
    if (filters.installmentCount !== undefined) {
      params = params.set('installmentCount', String(filters.installmentCount));
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
