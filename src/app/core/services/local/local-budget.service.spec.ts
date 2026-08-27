import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { LocalBudgetService } from './local-budget.service';

describe('LocalBudgetService', () => {
  let service: LocalBudgetService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalBudgetService);
  });

  it('should return undefined for a month without a budget', async () => {
    expect(await firstValueFrom(service.getByMonth('2026-03'))).toBeUndefined();
  });

  it('should create a monthly budget and find it by month', async () => {
    const created = await firstValueFrom(
      service.create({
        referenceMonth: '2026-03',
        plannedIncome: 4000,
        plannedExpenses: 3000,
        plannedReserve: 300,
      }),
    );

    const found = await firstValueFrom(service.getByMonth('2026-03'));
    expect(found).toEqual(created);
  });
});
