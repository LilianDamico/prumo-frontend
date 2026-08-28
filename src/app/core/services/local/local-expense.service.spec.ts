import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { Expense, ExpenseStatus } from '../../models';
import { LocalExpenseService } from './local-expense.service';

const STORAGE_KEY = 'prumo.expenses';

describe('LocalExpenseService', () => {
  let service: LocalExpenseService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalExpenseService);
  });

  it('should start empty', async () => {
    expect(await firstValueFrom(service.getAll())).toEqual([]);
  });

  it('should create an expense as pending and allow marking it as paid', async () => {
    const created = await firstValueFrom(
      service.create({
        accountId: 'acc-1',
        description: 'Aluguel',
        amount: 1200,
        dueDate: '2026-02-10',
        paymentDate: null,
        categoryId: 'moradia',
        recurring: true,
        status: ExpenseStatus.PENDING,
      }),
    );

    expect(created.status).toBe(ExpenseStatus.PENDING);
    expect(created.paymentDate).toBeNull();

    const paid = await firstValueFrom(
      service.update(created.id, { status: ExpenseStatus.PAID, paymentDate: '2026-02-08' }),
    );

    expect(paid.status).toBe(ExpenseStatus.PAID);
    expect(paid.paymentDate).toBe('2026-02-08');
  });

  it('should throw when updating an expense that does not exist', () => {
    expect(() => service.update('inexistente', { amount: 10 })).toThrow();
  });

  it('should treat legacy records without paymentDate as null', async () => {
    const legacy = {
      id: 'legacy-1',
      accountId: 'acc-1',
      categoryId: 'moradia',
      description: 'Aluguel antigo',
      amount: 900,
      dueDate: '2025-05-10',
      recurring: false,
      status: ExpenseStatus.PENDING,
      // paymentDate ausente propositalmente: dados gravados antes da
      // integração com o backend não tinham esse campo.
    } as unknown as Expense;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([legacy]));

    const [result] = await firstValueFrom(service.getAll());
    expect(result.paymentDate).toBeNull();

    const byId = await firstValueFrom(service.getById('legacy-1'));
    expect(byId?.paymentDate).toBeNull();
  });

  it('should support filtering by accountId, categoryId, recurring, status and date range', async () => {
    await firstValueFrom(
      service.create({
        accountId: 'acc-1',
        categoryId: 'moradia',
        description: 'Aluguel',
        amount: 1200,
        dueDate: '2026-02-10',
        paymentDate: null,
        recurring: true,
        status: ExpenseStatus.PENDING,
      }),
    );
    await firstValueFrom(
      service.create({
        accountId: 'acc-2',
        categoryId: 'lazer',
        description: 'Streaming',
        amount: 40,
        dueDate: '2026-02-15',
        paymentDate: '2026-02-14',
        recurring: false,
        status: ExpenseStatus.PAID,
      }),
    );

    expect((await firstValueFrom(service.getAll({ accountId: 'acc-1' }))).length).toBe(1);
    expect((await firstValueFrom(service.getAll({ categoryId: 'lazer' }))).length).toBe(1);
    expect((await firstValueFrom(service.getAll({ recurring: false }))).length).toBe(1);
    expect((await firstValueFrom(service.getAll({ status: ExpenseStatus.PAID }))).length).toBe(1);
    expect(
      (await firstValueFrom(service.getAll({ from: '2026-02-01', to: '2026-02-12' }))).length,
    ).toBe(1);
  });
});

