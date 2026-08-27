import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Expense } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import { CreateExpenseInput, ExpenseService, UpdateExpenseInput } from '../expense.service';

const STORAGE_KEY = 'prumo.expenses';

/** Implementação temporária de `ExpenseService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalExpenseService extends ExpenseService {
  private readonly repository = new LocalCollectionRepository<Expense>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  getAll(): Observable<Expense[]> {
    return of(this.repository.getAll());
  }

  getById(id: string): Observable<Expense | undefined> {
    return of(this.repository.getById(id));
  }

  create(input: CreateExpenseInput): Observable<Expense> {
    const expense: Expense = { ...input, id: generateId() };
    return of(this.repository.save(expense));
  }

  update(id: string, changes: UpdateExpenseInput): Observable<Expense> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Despesa "${id}" não encontrada.`);
    }
    return of(this.repository.save({ ...existing, ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }
}
