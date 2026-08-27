import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AccountType } from '../../models';
import { LocalAccountService } from './local-account.service';

describe('LocalAccountService', () => {
  let service: LocalAccountService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalAccountService);
  });

  it('should start with no accounts (no fictional data)', async () => {
    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });

  it('should create an account and generate an id', async () => {
    const created = await firstValueFrom(
      service.create({
        name: 'Conta corrente',
        institution: 'Banco X',
        type: AccountType.CHECKING,
        initialBalance: 0,
        currentBalance: 0,
        active: true,
      }),
    );

    expect(created.id).toBeTruthy();
    expect(await firstValueFrom(service.getAll())).toEqual([created]);
  });

  it('should update an existing account', async () => {
    const created = await firstValueFrom(
      service.create({
        name: 'Conta corrente',
        institution: 'Banco X',
        type: AccountType.CHECKING,
        initialBalance: 0,
        currentBalance: 0,
        active: true,
      }),
    );

    const updated = await firstValueFrom(service.update(created.id, { currentBalance: 500 }));

    expect(updated.currentBalance).toBe(500);
    expect(updated.name).toBe('Conta corrente');
  });

  it('should remove an account', async () => {
    const created = await firstValueFrom(
      service.create({
        name: 'Conta corrente',
        institution: 'Banco X',
        type: AccountType.CHECKING,
        initialBalance: 0,
        currentBalance: 0,
        active: true,
      }),
    );

    await firstValueFrom(service.remove(created.id));

    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });
});
