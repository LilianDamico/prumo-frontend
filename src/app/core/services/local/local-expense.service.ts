import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Expense } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import {
  CreateExpenseInput,
  ExpenseFilters,
  ExpenseService,
  UpdateExpenseInput,
} from '../expense.service';

const STORAGE_KEY = 'prumo.expenses';

/** Implementação temporária de `ExpenseService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalExpenseService extends ExpenseService {
  private readonly repository = new LocalCollectionRepository<Expense>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  override getAll(filters?: ExpenseFilters): Observable<Expense[]> {
    const expenses = this.repository.getAll().map((expense) => this.normalize(expense));
    return of(this.applyFilters(expenses, filters));
  }

  getById(id: string): Observable<Expense | undefined> {
    const existing = this.repository.getById(id);
    return of(existing ? this.normalize(existing) : undefined);
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
    return of(this.repository.save({ ...this.normalize(existing), ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }

  /**
   * Registros gravados antes da integração com o backend podem não conter
   * `paymentDate` (campo inexistente no `localStorage` antigo). Trata esse
   * caso de forma segura como `null`, sem migração complexa dos dados
   * gravados.
   */
  private normalize(expense: Expense): Expense {
    return { ...expense, paymentDate: expense.paymentDate ?? null };
  }

  /**
   * Aplica localmente os mesmos filtros suportados pelo backend
   * (`accountId`, `categoryId`, `recurring`, `status`, `from`, `to`). O
   * período é inclusivo; a comparação lexicográfica de `AAAA-MM-DD` é segura
   * porque o formato tem largura fixa e ordem de componentes ano-mês-dia.
   */
  private applyFilters(expenses: Expense[], filters?: ExpenseFilters): Expense[] {
    if (!filters) {
      return expenses;
    }
    return expenses.filter((expense) => {
      if (filters.accountId !== undefined && expense.accountId !== filters.accountId) {
        return false;
      }
      if (filters.categoryId !== undefined && expense.categoryId !== filters.categoryId) {
        return false;
      }
      if (filters.recurring !== undefined && expense.recurring !== filters.recurring) {
        return false;
      }
      if (filters.status !== undefined && expense.status !== filters.status) {
        return false;
      }
      if (filters.from !== undefined && expense.dueDate < filters.from) {
        return false;
      }
      if (filters.to !== undefined && expense.dueDate > filters.to) {
        return false;
      }
      return true;
    });
  }
}
