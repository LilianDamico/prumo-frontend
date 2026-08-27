import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IsoMonthString, MonthlyBudget } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import {
  BudgetService,
  CreateMonthlyBudgetInput,
  UpdateMonthlyBudgetInput,
} from '../budget.service';

const STORAGE_KEY = 'prumo.budgets';

/** Implementação temporária de `BudgetService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalBudgetService extends BudgetService {
  private readonly repository = new LocalCollectionRepository<MonthlyBudget>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  getAll(): Observable<MonthlyBudget[]> {
    return of(this.repository.getAll());
  }

  getById(id: string): Observable<MonthlyBudget | undefined> {
    return of(this.repository.getById(id));
  }

  getByMonth(referenceMonth: IsoMonthString): Observable<MonthlyBudget | undefined> {
    return of(
      this.repository.getAll().find((budget) => budget.referenceMonth === referenceMonth),
    );
  }

  create(input: CreateMonthlyBudgetInput): Observable<MonthlyBudget> {
    const budget: MonthlyBudget = { ...input, id: generateId() };
    return of(this.repository.save(budget));
  }

  update(id: string, changes: UpdateMonthlyBudgetInput): Observable<MonthlyBudget> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Orçamento "${id}" não encontrado.`);
    }
    return of(this.repository.save({ ...existing, ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }
}
