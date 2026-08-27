import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Income } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import { CreateIncomeInput, IncomeService, UpdateIncomeInput } from '../income.service';

const STORAGE_KEY = 'prumo.incomes';

/** Implementação temporária de `IncomeService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalIncomeService extends IncomeService {
  private readonly repository = new LocalCollectionRepository<Income>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  getAll(): Observable<Income[]> {
    return of(this.repository.getAll());
  }

  getById(id: string): Observable<Income | undefined> {
    return of(this.repository.getById(id));
  }

  create(input: CreateIncomeInput): Observable<Income> {
    const income: Income = { ...input, id: generateId() };
    return of(this.repository.save(income));
  }

  update(id: string, changes: UpdateIncomeInput): Observable<Income> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Receita "${id}" não encontrada.`);
    }
    return of(this.repository.save({ ...existing, ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }
}
