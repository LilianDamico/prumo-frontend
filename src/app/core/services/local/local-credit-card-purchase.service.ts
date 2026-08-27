import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CreditCardPurchase } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import {
  CreditCardPurchaseService,
  CreateCreditCardPurchaseInput,
  UpdateCreditCardPurchaseInput,
} from '../credit-card-purchase.service';

const STORAGE_KEY = 'prumo.credit-card-purchases';

/** Implementação temporária de `CreditCardPurchaseService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalCreditCardPurchaseService extends CreditCardPurchaseService {
  private readonly repository = new LocalCollectionRepository<CreditCardPurchase>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  getAll(): Observable<CreditCardPurchase[]> {
    return of(this.repository.getAll());
  }

  getByCard(creditCardId: string): Observable<CreditCardPurchase[]> {
    return of(this.repository.getAll().filter((purchase) => purchase.creditCardId === creditCardId));
  }

  getById(id: string): Observable<CreditCardPurchase | undefined> {
    return of(this.repository.getById(id));
  }

  create(input: CreateCreditCardPurchaseInput): Observable<CreditCardPurchase> {
    const purchase: CreditCardPurchase = { ...input, id: generateId() };
    return of(this.repository.save(purchase));
  }

  update(id: string, changes: UpdateCreditCardPurchaseInput): Observable<CreditCardPurchase> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Compra "${id}" não encontrada.`);
    }
    return of(this.repository.save({ ...existing, ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }
}
