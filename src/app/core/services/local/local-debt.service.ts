import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Debt } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import { CreateDebtInput, DebtService, UpdateDebtInput } from '../debt.service';

const STORAGE_KEY = 'prumo.debts';

/** Implementação temporária de `DebtService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalDebtService extends DebtService {
  private readonly repository = new LocalCollectionRepository<Debt>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  getAll(): Observable<Debt[]> {
    return of(this.repository.getAll());
  }

  getById(id: string): Observable<Debt | undefined> {
    return of(this.repository.getById(id));
  }

  create(input: CreateDebtInput): Observable<Debt> {
    const debt: Debt = { ...input, id: generateId() };
    return of(this.repository.save(debt));
  }

  update(id: string, changes: UpdateDebtInput): Observable<Debt> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Dívida "${id}" não encontrada.`);
    }
    return of(this.repository.save({ ...existing, ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }
}
