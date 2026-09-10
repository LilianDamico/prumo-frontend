import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CreditCardPurchase } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import {
  CreditCardPurchaseService,
  CreateCreditCardPurchaseInput,
  CreditCardPurchaseFilters,
  UpdateCreditCardPurchaseInput,
} from '../credit-card-purchase.service';

const STORAGE_KEY = 'prumo.credit-card-purchases';

/**
 * Forma como uma compra pode existir fisicamente no `localStorage`,
 * incluindo o nome de campo legado `installmentsCount` (anterior à
 * renomeação para `installmentCount`, alinhada ao backend).
 */
type StoredCreditCardPurchase = CreditCardPurchase & { installmentsCount?: number };

/**
 * Normaliza uma compra lida do `localStorage` para o contrato atual.
 * Registros antigos gravados com `installmentsCount` continuam legíveis
 * (o valor é lido como `installmentCount` na leitura). Não regrava o
 * `localStorage`, não fabrica timestamps e preserva `installmentAmount`
 * apenas se já existir no registro (nunca o calcula aqui).
 */
function normalizePurchase(raw: StoredCreditCardPurchase): CreditCardPurchase {
  const { installmentsCount, ...purchase } = raw;
  return {
    ...purchase,
    installmentCount: purchase.installmentCount ?? installmentsCount ?? 0,
  };
}

/** Implementação temporária de `CreditCardPurchaseService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalCreditCardPurchaseService extends CreditCardPurchaseService {
  private readonly repository = new LocalCollectionRepository<CreditCardPurchase>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  getAll(filters?: CreditCardPurchaseFilters): Observable<CreditCardPurchase[]> {
    const all = (this.repository.getAll() as StoredCreditCardPurchase[]).map(normalizePurchase);
    return of(all.filter((purchase) => this.matchesFilters(purchase, filters)));
  }

  getByCard(creditCardId: string): Observable<CreditCardPurchase[]> {
    return this.getAll({ creditCardId });
  }

  getById(id: string): Observable<CreditCardPurchase | undefined> {
    const existing = this.repository.getById(id) as StoredCreditCardPurchase | undefined;
    return of(existing ? normalizePurchase(existing) : undefined);
  }

  create(input: CreateCreditCardPurchaseInput): Observable<CreditCardPurchase> {
    const purchase: CreditCardPurchase = { ...input, id: generateId() };
    return of(this.repository.save(purchase));
  }

  update(id: string, changes: UpdateCreditCardPurchaseInput): Observable<CreditCardPurchase> {
    const existing = this.repository.getById(id) as StoredCreditCardPurchase | undefined;
    if (!existing) {
      throw new Error(`Compra "${id}" não encontrada.`);
    }
    const normalized = normalizePurchase(existing);
    return of(this.repository.save({ ...normalized, ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }

  /** Reflete os mesmos filtros aceitos pelo backend (`findAllFiltered`). */
  private matchesFilters(purchase: CreditCardPurchase, filters?: CreditCardPurchaseFilters): boolean {
    if (!filters) {
      return true;
    }
    if (filters.creditCardId !== undefined && purchase.creditCardId !== filters.creditCardId) {
      return false;
    }
    if (filters.categoryId !== undefined && purchase.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.installmentCount !== undefined && purchase.installmentCount !== filters.installmentCount) {
      return false;
    }
    if (filters.from !== undefined && purchase.purchaseDate < filters.from) {
      return false;
    }
    if (filters.to !== undefined && purchase.purchaseDate > filters.to) {
      return false;
    }
    return true;
  }
}
