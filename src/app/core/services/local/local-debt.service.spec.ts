import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { DebtStatus, DebtType } from '../../models';
import { LocalDebtService } from './local-debt.service';

describe('LocalDebtService', () => {
  let service: LocalDebtService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalDebtService);
  });

  it('should allow creating a debt without an interest rate (user may not know it)', async () => {
    const created = await firstValueFrom(
      service.create({
        creditor: 'Banco Y',
        description: 'Empréstimo pessoal',
        type: DebtType.PERSONAL_LOAN,
        originalAmount: 5000,
        currentBalance: 4200,
        dueDay: 15,
        startDate: '2025-06-01',
        status: DebtStatus.ACTIVE,
      }),
    );

    expect(created.interestRateMonthly).toBeUndefined();
    expect(created.minimumPayment).toBeUndefined();
  });

  it('should store a known interest rate when provided', async () => {
    const created = await firstValueFrom(
      service.create({
        creditor: 'Cartão Z',
        description: 'Fatura parcelada',
        type: DebtType.CREDIT_CARD,
        originalAmount: 1000,
        currentBalance: 1000,
        interestRateMonthly: 8,
        dueDay: 10,
        startDate: '2026-01-01',
        status: DebtStatus.ACTIVE,
      }),
    );

    expect(created.interestRateMonthly).toBe(8);
  });

  it('should not fabricate createdAt/updatedAt for records created locally', async () => {
    const created = await firstValueFrom(
      service.create({
        creditor: 'Banco Y',
        description: 'Empréstimo pessoal',
        type: DebtType.PERSONAL_LOAN,
        originalAmount: 5000,
        currentBalance: 4200,
        dueDay: 15,
        startDate: '2025-06-01',
        status: DebtStatus.ACTIVE,
      }),
    );

    expect(created.createdAt).toBeUndefined();
    expect(created.updatedAt).toBeUndefined();
  });

  describe('filters', () => {
    beforeEach(async () => {
      await firstValueFrom(
        service.create({
          creditor: 'Banco Bradesco',
          description: 'Cartão de crédito',
          type: DebtType.CREDIT_CARD,
          originalAmount: 12000,
          currentBalance: 8450,
          dueDay: 10,
          startDate: '2026-01-01',
          status: DebtStatus.ACTIVE,
        }),
      );
      await firstValueFrom(
        service.create({
          creditor: 'Nubank',
          description: 'Empréstimo pessoal',
          type: DebtType.PERSONAL_LOAN,
          originalAmount: 1000,
          currentBalance: 0,
          dueDay: 20,
          startDate: '2025-06-01',
          status: DebtStatus.PAID,
        }),
      );
    });

    it('should filter by status', async () => {
      const result = await firstValueFrom(service.getAll({ status: DebtStatus.PAID }));
      expect(result.map((debt) => debt.creditor)).toEqual(['Nubank']);
    });

    it('should filter by type', async () => {
      const result = await firstValueFrom(service.getAll({ type: DebtType.CREDIT_CARD }));
      expect(result.map((debt) => debt.creditor)).toEqual(['Banco Bradesco']);
    });

    it('should filter by dueDay with exact comparison', async () => {
      const result = await firstValueFrom(service.getAll({ dueDay: 10 }));
      expect(result.map((debt) => debt.creditor)).toEqual(['Banco Bradesco']);
    });

    it('should filter by creditor with a partial, case-insensitive match', async () => {
      const result = await firstValueFrom(service.getAll({ creditor: 'brad' }));
      expect(result.map((debt) => debt.creditor)).toEqual(['Banco Bradesco']);
    });

    it('should combine multiple filters', async () => {
      const result = await firstValueFrom(
        service.getAll({ status: DebtStatus.ACTIVE, type: DebtType.CREDIT_CARD, dueDay: 10 }),
      );
      expect(result.map((debt) => debt.creditor)).toEqual(['Banco Bradesco']);
    });

    it('should return every debt when no filter is provided', async () => {
      const result = await firstValueFrom(service.getAll());
      expect(result).toHaveLength(2);
    });
  });
});

