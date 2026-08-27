import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category, CategoryType } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import { CategoryService, CreateCategoryInput, UpdateCategoryInput } from '../category.service';
import { DEFAULT_CATEGORIES } from './category-seed.data';

const STORAGE_KEY = 'prumo.categories';

/**
 * Implementação temporária de `CategoryService` baseada em `localStorage`.
 * Diferente das demais entidades, categorias começam com um conjunto
 * inicial sugerido (`DEFAULT_CATEGORIES`), pois são necessárias para
 * classificar receitas e despesas desde o primeiro uso.
 */
@Injectable({ providedIn: 'root' })
export class LocalCategoryService extends CategoryService {
  private readonly repository = new LocalCollectionRepository<Category>(
    inject(LocalStorageService),
    STORAGE_KEY,
    () => [...DEFAULT_CATEGORIES],
  );

  getAll(): Observable<Category[]> {
    return of(this.repository.getAll());
  }

  getByType(type: CategoryType): Observable<Category[]> {
    return of(this.repository.getAll().filter((category) => category.type === type));
  }

  getById(id: string): Observable<Category | undefined> {
    return of(this.repository.getById(id));
  }

  create(input: CreateCategoryInput): Observable<Category> {
    const category: Category = {
      id: generateId(),
      name: input.name,
      type: input.type,
      active: true,
      essential: input.essential ?? false,
    };
    return of(this.repository.save(category));
  }

  update(id: string, changes: UpdateCategoryInput): Observable<Category> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Categoria "${id}" não encontrada.`);
    }
    return of(this.repository.save({ ...existing, ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }
}
