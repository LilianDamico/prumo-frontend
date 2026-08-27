import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CreditCard } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import {
  CreateCreditCardInput,
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

  getAll(): Observable<CreditCard[]> {
    return of(this.repository.getAll());
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
