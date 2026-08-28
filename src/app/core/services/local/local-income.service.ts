import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Income } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import {
  CreateIncomeInput,
  IncomeFilters,
  IncomeService,
  UpdateIncomeInput,
} from '../income.service';

const STORAGE_KEY = 'prumo.incomes';

/** Implementação temporária de `IncomeService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalIncomeService extends IncomeService {
  private readonly repository = new LocalCollectionRepository<Income>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  override getAll(filters?: IncomeFilters): Observable<Income[]> {
    return of(this.applyFilters(this.repository.getAll(), filters));
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

  /**
   * Aplica localmente os mesmos filtros suportados pelo backend
   * (`accountId`, `categoryId`, `recurring`, `from`, `to`). O período é
   * inclusivo; a comparação lexicográfica de `AAAA-MM-DD` é segura porque o
   * formato tem largura fixa e ordem de componentes ano-mês-dia.
   */
  private applyFilters(incomes: Income[], filters?: IncomeFilters): Income[] {
    if (!filters) {
      return incomes;
    }
    return incomes.filter((income) => {
      if (filters.accountId !== undefined && income.accountId !== filters.accountId) {
        return false;
      }
      if (filters.categoryId !== undefined && income.categoryId !== filters.categoryId) {
        return false;
      }
      if (filters.recurring !== undefined && income.recurring !== filters.recurring) {
        return false;
      }
      if (filters.from !== undefined && income.incomeDate < filters.from) {
        return false;
      }
      if (filters.to !== undefined && income.incomeDate > filters.to) {
        return false;
      }
      return true;
    });
  }
}

