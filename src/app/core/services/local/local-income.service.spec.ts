import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { LocalIncomeService } from './local-income.service';

describe('LocalIncomeService', () => {
  let service: LocalIncomeService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalIncomeService);
  });

  it('should start empty', async () => {
    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });

  it('should create, update and remove an income', async () => {
    const created = await firstValueFrom(
      service.create({
        accountId: 'acc-1',
        description: 'Salário',
        amount: 3000,
        incomeDate: '2026-01-05',
        categoryId: 'salario',
        recurring: true,
      }),
    );

    expect(created.id).toBeTruthy();

    const updated = await firstValueFrom(service.update(created.id, { amount: 3200 }));
    expect(updated.amount).toBe(3200);

    await firstValueFrom(service.remove(created.id));
    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });
});
