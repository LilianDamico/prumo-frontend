import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Account } from '../../models';
import { generateId } from '../../utils/id.util';
import { LocalCollectionRepository } from '../storage/local-collection-repository';
import { LocalStorageService } from '../storage/local-storage.service';
import { AccountService, CreateAccountInput, UpdateAccountInput } from '../account.service';

const STORAGE_KEY = 'prumo.accounts';

/** Implementação temporária de `AccountService` baseada em `localStorage`. */
@Injectable({ providedIn: 'root' })
export class LocalAccountService extends AccountService {
  private readonly repository = new LocalCollectionRepository<Account>(
    inject(LocalStorageService),
    STORAGE_KEY,
  );

  getAll(): Observable<Account[]> {
    return of(this.repository.getAll());
  }

  getById(id: string): Observable<Account | undefined> {
    return of(this.repository.getById(id));
  }

  create(input: CreateAccountInput): Observable<Account> {
    const account: Account = { ...input, id: generateId() };
    return of(this.repository.save(account));
  }

  update(id: string, changes: UpdateAccountInput): Observable<Account> {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Conta "${id}" não encontrada.`);
    }
    return of(this.repository.save({ ...existing, ...changes, id }));
  }

  remove(id: string): Observable<void> {
    this.repository.remove(id);
    return of(undefined);
  }
}
