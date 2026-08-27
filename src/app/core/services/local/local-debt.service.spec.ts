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
});
