import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Debt } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import { CreateDebtInput, DebtFilters, DebtService, UpdateDebtInput } from '../debt.service';

const STORAGE_KEY = 'prumo.debts';

/**
 * Implementação temporária de `DebtService` baseada em `localStorage`.
 * Não gera `createdAt`/`updatedAt` artificialmente (esses campos são
 * somente de resposta do backend; registros locais simplesmente não os
 * possuem).
 */
@Injectable({ providedIn: 'root' })
export class LocalDebtService extends DebtService {
  private readonly repository = new LocalCollectionRepository<Debt>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  override getAll(filters?: DebtFilters): Observable<Debt[]> {
    return of(this.applyFilters(this.repository.getAll(), filters));
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

  /**
   * Aplica localmente os mesmos filtros suportados pelo backend (`status`,
   * `type`, `creditor`, `dueDay`). `creditor` é busca parcial e
   * case-insensitive (equivalente ao `LOWER(...) LIKE ...` do backend);
   * `dueDay` é comparação exata.
   */
  private applyFilters(debts: Debt[], filters?: DebtFilters): Debt[] {
    if (!filters) {
      return debts;
    }
    const creditorQuery = filters.creditor?.trim().toLowerCase();
    return debts.filter((debt) => {
      if (filters.status !== undefined && debt.status !== filters.status) {
        return false;
      }
      if (filters.type !== undefined && debt.type !== filters.type) {
        return false;
      }
      if (filters.dueDay !== undefined && debt.dueDay !== filters.dueDay) {
        return false;
      }
      if (creditorQuery && !debt.creditor.toLowerCase().includes(creditorQuery)) {
        return false;
      }
      return true;
    });
  }
}
