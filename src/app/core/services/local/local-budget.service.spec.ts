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

  it('should create a monthly budget with the new contract and find it by month', async () => {
    const created = await firstValueFrom(
      service.create({
        referenceMonth: '2026-03',
        expectedIncome: 4000,
        maximumExpenses: 3000,
        debtPaymentTarget: 500,
        emergencyReserveTarget: 300,
      }),
    );

    expect(created.expectedIncome).toBe(4000);
    expect(created.maximumExpenses).toBe(3000);
    expect(created.debtPaymentTarget).toBe(500);
    expect(created.emergencyReserveTarget).toBe(300);

    const found = await firstValueFrom(service.getByMonth('2026-03'));
    expect(found).toEqual(created);
  });

  it('should normalize a legacy record (plannedIncome/plannedExpenses/plannedReserve) to the new field names', async () => {
    window.localStorage.setItem(
      'prumo.budgets',
      JSON.stringify([
        {
          id: 'legacy-1',
          referenceMonth: '2026-01',
          plannedIncome: 5000,
          plannedExpenses: 3500,
          plannedReserve: 400,
        },
      ]),
    );

    const found = await firstValueFrom(service.getByMonth('2026-01'));
    expect(found).toEqual({
      id: 'legacy-1',
      referenceMonth: '2026-01',
      expectedIncome: 5000,
      maximumExpenses: 3500,
      debtPaymentTarget: 0,
      emergencyReserveTarget: 400,
    });
  });

  it('should default debtPaymentTarget to 0 when absent from a legacy record', async () => {
    window.localStorage.setItem(
      'prumo.budgets',
      JSON.stringify([
        {
          id: 'legacy-2',
          referenceMonth: '2026-02',
          plannedIncome: 1000,
          plannedExpenses: 800,
          plannedReserve: 100,
        },
      ]),
    );

    const found = await firstValueFrom(service.getByMonth('2026-02'));
    expect(found?.debtPaymentTarget).toBe(0);
  });

  it('should preserve createdAt/updatedAt when they already exist on a record', async () => {
    window.localStorage.setItem(
      'prumo.budgets',
      JSON.stringify([
        {
          id: 'legacy-3',
          referenceMonth: '2026-04',
          expectedIncome: 2000,
          maximumExpenses: 1500,
          debtPaymentTarget: 200,
          emergencyReserveTarget: 300,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-02T00:00:00.000Z',
        },
      ]),
    );

    const found = await firstValueFrom(service.getByMonth('2026-04'));
    expect(found?.createdAt).toBe('2026-04-01T00:00:00.000Z');
    expect(found?.updatedAt).toBe('2026-04-02T00:00:00.000Z');
  });

  it('should not fabricate createdAt/updatedAt when they are absent', async () => {
    const created = await firstValueFrom(
      service.create({
        referenceMonth: '2026-05',
        expectedIncome: 1000,
        maximumExpenses: 700,
        debtPaymentTarget: 0,
        emergencyReserveTarget: 100,
      }),
    );

    expect(created.createdAt).toBeUndefined();
    expect(created.updatedAt).toBeUndefined();
  });

  it('should reject creating a duplicate budget for the same referenceMonth', async () => {
    await firstValueFrom(
      service.create({
        referenceMonth: '2026-06',
        expectedIncome: 1000,
        maximumExpenses: 700,
        debtPaymentTarget: 0,
        emergencyReserveTarget: 100,
      }),
    );

    expect(() =>
      service.create({
        referenceMonth: '2026-06',
        expectedIncome: 2000,
        maximumExpenses: 1000,
        debtPaymentTarget: 0,
        emergencyReserveTarget: 200,
      }),
    ).toThrow();
  });

  it('should reject updating a budget to a referenceMonth that belongs to another budget', async () => {
    await firstValueFrom(
      service.create({
        referenceMonth: '2026-07',
        expectedIncome: 1000,
        maximumExpenses: 700,
        debtPaymentTarget: 0,
        emergencyReserveTarget: 100,
      }),
    );
    const second = await firstValueFrom(
      service.create({
        referenceMonth: '2026-08',
        expectedIncome: 1200,
        maximumExpenses: 800,
        debtPaymentTarget: 0,
        emergencyReserveTarget: 150,
      }),
    );

    expect(() => service.update(second.id, { referenceMonth: '2026-07' })).toThrow();
  });

  it('should update an existing budget normally', async () => {
    const created = await firstValueFrom(
      service.create({
        referenceMonth: '2026-09',
        expectedIncome: 1000,
        maximumExpenses: 700,
        debtPaymentTarget: 0,
        emergencyReserveTarget: 100,
      }),
    );

    const updated = await firstValueFrom(
      service.update(created.id, { emergencyReserveTarget: 250 }),
    );

    expect(updated.emergencyReserveTarget).toBe(250);
    expect(updated.expectedIncome).toBe(1000);
  });

  it('should keep removing budgets working', async () => {
    const created = await firstValueFrom(
      service.create({
        referenceMonth: '2026-10',
        expectedIncome: 1000,
        maximumExpenses: 700,
        debtPaymentTarget: 0,
        emergencyReserveTarget: 100,
      }),
    );

    await firstValueFrom(service.remove(created.id));

    expect(await firstValueFrom(service.getById(created.id))).toBeUndefined();
  });
});
