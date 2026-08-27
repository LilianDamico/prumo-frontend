import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ExpenseStatus } from '../../models';
import { LocalExpenseService } from './local-expense.service';

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
        categoryId: 'moradia',
        recurring: true,
        status: ExpenseStatus.PENDING,
      }),
    );

    expect(created.status).toBe(ExpenseStatus.PENDING);

    const paid = await firstValueFrom(
      service.update(created.id, { status: ExpenseStatus.PAID, paymentDate: '2026-02-08' }),
    );

    expect(paid.status).toBe(ExpenseStatus.PAID);
    expect(paid.paymentDate).toBe('2026-02-08');
  });

  it('should throw when updating an expense that does not exist', () => {
    expect(() => service.update('inexistente', { amount: 10 })).toThrow();
  });
});
