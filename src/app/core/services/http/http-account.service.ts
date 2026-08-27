import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Account, AccountType } from '../../models';
import {
  AccountService,
  CreateAccountInput,
  UpdateAccountInput,
} from '../account.service';

/**
 * Payload de criação enviado ao backend (`POST /accounts`).
 */
interface CreateAccountRequest {
  name: string;
  institution: string | null;
  type: AccountType;
  currentBalance: number;
  active: boolean;
}

/**
 * Payload de atualização enviado ao backend (`PUT /accounts/{id}`).
 * O backend espera sempre os quatro campos; por isso o service busca o
 * registro atual antes de enviar, permitindo chamadas parciais (mesmo
 * comportamento de `HttpCategoryService`).
 */
interface UpdateAccountRequest {
  name: string;
  institution: string | null;
  type: AccountType;
  currentBalance: number;
  active: boolean;
}

/**
 * Implementação de `AccountService` que consome a API REST do backend
 * Spring Boot (`/api/v1/accounts`). Não conhece nenhum detalhe de
 * componente — apenas monta URLs a partir de `API_BASE_URL` e mapeia o
 * contrato `AccountResponse` para o model `Account` do frontend.
 */
@Injectable({ providedIn: 'root' })
export class HttpAccountService extends AccountService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/accounts`;

  getAll(): Observable<Account[]> {
    return this.http.get<Account[]>(this.baseUrl);
  }

  getById(id: string): Observable<Account | undefined> {
    return this.http.get<Account>(`${this.baseUrl}/${id}`);
  }

  create(input: CreateAccountInput): Observable<Account> {
    const body: CreateAccountRequest = {
      name: input.name,
      institution: input.institution,
      type: input.type,
      currentBalance: input.currentBalance,
      active: input.active,
    };
    return this.http.post<Account>(this.baseUrl, body);
  }

  update(id: string, changes: UpdateAccountInput): Observable<Account> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const body: UpdateAccountRequest = {
          name: changes.name ?? existing?.name ?? '',
          institution: changes.institution ?? existing?.institution ?? null,
          type: changes.type ?? existing?.type ?? AccountType.CHECKING,
          currentBalance: changes.currentBalance ?? existing?.currentBalance ?? 0,
          active: changes.active ?? existing?.active ?? true,
        };
        return this.http.put<Account>(`${this.baseUrl}/${id}`, body);
      }),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }
}
