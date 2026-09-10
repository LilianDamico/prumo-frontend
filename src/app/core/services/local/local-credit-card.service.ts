import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CreditCard } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import {
  CreateCreditCardInput,
  CreditCardFilters,
  CreditCardService,
  UpdateCreditCardInput,
} from '../credit-card.service';

const STORAGE_KEY = 'prumo.credit-cards';

/** Implementação temporária de `CreditCardService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalCreditCardService extends CreditCardService {
  private readonly repository = new LocalCollectionRepository<CreditCard>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  /**
   * `filters.active` precisa ser comparado explicitamente contra
   * `undefined` — `false` é um valor de filtro válido (cartões inativos) e
   * não pode ser tratado como "ausente" (`if (filters?.active)` excluiria
   * indevidamente esse caso).
   */
  getAll(filters?: CreditCardFilters): Observable<CreditCard[]> {
    const all = this.repository.getAll();
    if (filters?.active === undefined) {
      return of(all);
    }
    return of(all.filter((creditCard) => creditCard.active === filters.active));
  }

  getById(id: string): Observable<CreditCard | undefined> {
    return of(this.repository.getById(id));
  }

  create(input: CreateCreditCardInput): Observable<CreditCard> {
    const creditCard: CreditCard = { ...input, id: generateId() };
    return of(this.repository.save(creditCard));
  }

  update(id: string, changes: UpdateCreditCardInput): Observable<CreditCard> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Cartão "${id}" não encontrado.`);
    }
    return of(this.repository.save({ ...existing, ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }
}
