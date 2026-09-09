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

/**
 * Formato legado (pré-sincronização com o backend) que pode ainda existir
 * no `localStorage` de usuários que já usavam o app.
 */
interface LegacyMonthlyBudget {
  id: string;
  referenceMonth: IsoMonthString;
  plannedIncome?: number;
  plannedExpenses?: number;
  plannedReserve?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Normaliza um registro cru vindo do `localStorage` (novo ou legado) para o
 * contrato atual de `MonthlyBudget`. Não regrava nada em disco: a
 * normalização acontece apenas em memória, a cada leitura.
 */
function normalizeBudget(raw: MonthlyBudget | LegacyMonthlyBudget): MonthlyBudget {
  const legacy = raw as LegacyMonthlyBudget;
  const current = raw as MonthlyBudget;

  return {
    id: raw.id,
    referenceMonth: raw.referenceMonth,
    expectedIncome: current.expectedIncome ?? legacy.plannedIncome ?? 0,
    maximumExpenses: current.maximumExpenses ?? legacy.plannedExpenses ?? 0,
    debtPaymentTarget: current.debtPaymentTarget ?? 0,
    emergencyReserveTarget: current.emergencyReserveTarget ?? legacy.plannedReserve ?? 0,
    ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
    ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
  };
}

/** Implementação temporária de `BudgetService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalBudgetService extends BudgetService {
  private readonly repository = new LocalCollectionRepository<MonthlyBudget>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  getAll(): Observable<MonthlyBudget[]> {
    return of(this.repository.getAll().map(normalizeBudget));
  }

  getById(id: string): Observable<MonthlyBudget | undefined> {
    const found = this.repository.getById(id);
    return of(found ? normalizeBudget(found) : undefined);
  }

  getByMonth(referenceMonth: IsoMonthString): Observable<MonthlyBudget | undefined> {
    const found = this.repository
      .getAll()
      .find((budget) => budget.referenceMonth === referenceMonth);
    return of(found ? normalizeBudget(found) : undefined);
  }

  create(input: CreateMonthlyBudgetInput): Observable<MonthlyBudget> {
    const duplicate = this.repository
      .getAll()
      .find((budget) => budget.referenceMonth === input.referenceMonth);
    if (duplicate) {
      throw new Error(`Já existe um orçamento cadastrado para o mês "${input.referenceMonth}".`);
    }

    const budget: MonthlyBudget = { ...input, id: generateId() };
    return of(normalizeBudget(this.repository.save(budget)));
  }

  update(id: string, changes: UpdateMonthlyBudgetInput): Observable<MonthlyBudget> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Orçamento "${id}" não encontrado.`);
    }

    if (changes.referenceMonth) {
      const conflicting = this.repository
        .getAll()
        .find((budget) => budget.referenceMonth === changes.referenceMonth && budget.id !== id);
      if (conflicting) {
        throw new Error(
          `Já existe um orçamento cadastrado para o mês "${changes.referenceMonth}".`,
        );
      }
    }

    const merged: MonthlyBudget = { ...normalizeBudget(existing), ...changes, id };
    return of(this.repository.save(merged));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }
}
