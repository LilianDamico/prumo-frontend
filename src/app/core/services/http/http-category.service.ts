import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Category, CategoryType } from '../../models';
import {
  CategoryService,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../category.service';

/**
 * Payload de criação enviado ao backend (`POST /categories`).
 */
interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  essential: boolean;
}

/**
 * Payload de atualização enviado ao backend (`PUT /categories/{id}`).
 * O backend espera sempre os quatro campos; por isso o service busca o
 * registro atual antes de enviar, permitindo chamadas parciais (mesmo
 * comportamento de `LocalCategoryService.update`).
 */
interface UpdateCategoryRequest {
  name: string;
  type: CategoryType;
  active: boolean;
  essential: boolean;
}

/**
 * Implementação de `CategoryService` que consome a API REST do backend
 * Spring Boot (`/api/v1/categories`). Não conhece nenhum detalhe de
 * componente — apenas monta URLs a partir de `API_BASE_URL` e mapeia o
 * contrato `CategoryResponse` para o model `Category` do frontend.
 */
@Injectable({ providedIn: 'root' })
export class HttpCategoryService extends CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/categories`;

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  getByType(type: CategoryType): Observable<Category[]> {
    const params = new HttpParams().set('type', type);
    return this.http.get<Category[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Category | undefined> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }

  create(input: CreateCategoryInput): Observable<Category> {
    const body: CreateCategoryRequest = {
      name: input.name,
      type: input.type,
      essential: input.essential,
    };
    return this.http.post<Category>(this.baseUrl, body);
  }

  update(id: string, changes: UpdateCategoryInput): Observable<Category> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const body: UpdateCategoryRequest = {
          name: changes.name ?? existing?.name ?? '',
          type: changes.type ?? existing?.type ?? CategoryType.EXPENSE,
          active: changes.active ?? existing?.active ?? true,
          essential: changes.essential ?? existing?.essential ?? false,
        };
        return this.http.put<Category>(`${this.baseUrl}/${id}`, body);
      }),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }
}
