import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Debt, DebtStatus, DebtType } from '../../models';
import { HttpDebtService } from './http-debt.service';

const BASE_URL = 'http://localhost:8080/api/v1';

function debt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'debt-1',
    creditor: 'Bradesco',
    description: 'Cartão de crédito',
    type: DebtType.CREDIT_CARD,
    originalAmount: 12000,
    currentBalance: 8450,
    interestRateMonthly: 12.5,
    minimumPayment: 850,
    dueDay: 10,
    startDate: '2026-01-01',
    status: DebtStatus.ACTIVE,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('HttpDebtService', () => {
  let service: HttpDebtService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(HttpDebtService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET the debt collection without filters', async () => {
    const promise = firstValueFrom(service.getAll());

    const req = httpMock.expectOne(`${BASE_URL}/debts`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([debt()]);

    const result = await promise;
    expect(result).toEqual([debt()]);
  });

  it('should GET filtering by status', async () => {
    const promise = firstValueFrom(service.getAll({ status: DebtStatus.ACTIVE }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/debts` && request.params.get('status') === 'ACTIVE',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([debt()]);

    await promise;
  });

  it('should GET filtering by type', async () => {
    const promise = firstValueFrom(service.getAll({ type: DebtType.CREDIT_CARD }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/debts` && request.params.get('type') === 'CREDIT_CARD',
    );
    req.flush([debt()]);

    await promise;
  });

  it('should GET filtering by creditor', async () => {
    const promise = firstValueFrom(service.getAll({ creditor: 'brad' }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/debts` && request.params.get('creditor') === 'brad',
    );
    req.flush([debt()]);

    await promise;
  });

  it('should GET filtering by dueDay', async () => {
    const promise = firstValueFrom(service.getAll({ dueDay: 10 }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/debts` && request.params.get('dueDay') === '10',
    );
    req.flush([debt()]);

    await promise;
  });

  it('should GET combining multiple filters', async () => {
    const promise = firstValueFrom(
      service.getAll({ status: DebtStatus.ACTIVE, type: DebtType.CREDIT_CARD, creditor: 'brad', dueDay: 10 }),
    );

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/debts` &&
        request.params.get('status') === 'ACTIVE' &&
        request.params.get('type') === 'CREDIT_CARD' &&
        request.params.get('creditor') === 'brad' &&
        request.params.get('dueDay') === '10',
    );
    expect(req.request.params.keys().length).toBe(4);
    req.flush([debt()]);

    await promise;
  });

  it('should GET a debt by id', async () => {
    const promise = firstValueFrom(service.getById('debt-1'));

    const req = httpMock.expectOne(`${BASE_URL}/debts/debt-1`);
    expect(req.request.method).toBe('GET');
    req.flush(debt());

    const result = await promise;
    expect(result).toEqual(debt());
  });

  it('should receive createdAt/updatedAt from the backend', async () => {
    const promise = firstValueFrom(service.getById('debt-1'));

    const req = httpMock.expectOne(`${BASE_URL}/debts/debt-1`);
    req.flush(debt());

    const result = await promise;
    expect(result?.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(result?.updatedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should preserve startDate as a plain YYYY-MM-DD string, without Date conversion', async () => {
    const promise = firstValueFrom(service.getById('debt-1'));

    const req = httpMock.expectOne(`${BASE_URL}/debts/debt-1`);
    req.flush(debt({ startDate: '2026-12-31' }));

    const result = await promise;
    expect(result?.startDate).toBe('2026-12-31');
  });

  it('should not convert interestRateMonthly (percentage transported as-is)', async () => {
    const promise = firstValueFrom(service.getById('debt-1'));

    const req = httpMock.expectOne(`${BASE_URL}/debts/debt-1`);
    req.flush(debt({ interestRateMonthly: 12.5 }));

    const result = await promise;
    expect(result?.interestRateMonthly).toBe(12.5);
  });

  it('should normalize null optional fields from the backend to undefined', async () => {
    const promise = firstValueFrom(service.getById('debt-1'));

    const req = httpMock.expectOne(`${BASE_URL}/debts/debt-1`);
    req.flush({
      ...debt(),
      interestRateMonthly: null,
      minimumPayment: null,
      installmentAmount: null,
      totalInstallments: null,
      remainingInstallments: null,
    });

    const result = await promise;
    expect(result?.interestRateMonthly).toBeUndefined();
    expect(result?.minimumPayment).toBeUndefined();
    expect(result?.installmentAmount).toBeUndefined();
    expect(result?.totalInstallments).toBeUndefined();
    expect(result?.remainingInstallments).toBeUndefined();
  });

  it('should POST to create a debt without id/createdAt/updatedAt', async () => {
    const promise = firstValueFrom(
      service.create({
        creditor: 'Bradesco',
        description: 'Cartão de crédito',
        type: DebtType.CREDIT_CARD,
        originalAmount: 12000,
        currentBalance: 8450,
        interestRateMonthly: 12.5,
        minimumPayment: 850,
        dueDay: 10,
        startDate: '2026-01-01',
        status: DebtStatus.ACTIVE,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/debts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      creditor: 'Bradesco',
      description: 'Cartão de crédito',
      type: 'CREDIT_CARD',
      originalAmount: 12000,
      currentBalance: 8450,
      interestRateMonthly: 12.5,
      minimumPayment: 850,
      installmentAmount: null,
      totalInstallments: null,
      remainingInstallments: null,
      dueDay: 10,
      startDate: '2026-01-01',
      status: 'ACTIVE',
    });
    expect(req.request.body.id).toBeUndefined();
    expect(req.request.body.createdAt).toBeUndefined();
    expect(req.request.body.updatedAt).toBeUndefined();
    req.flush(debt());

    const result = await promise;
    expect(result.id).toBe('debt-1');
  });

  it('should POST sending null explicitly for absent optional fields', async () => {
    const promise = firstValueFrom(
      service.create({
        creditor: 'Nubank',
        description: 'Empréstimo',
        type: DebtType.PERSONAL_LOAN,
        originalAmount: 1000,
        currentBalance: 500,
        dueDay: 15,
        startDate: '2026-01-01',
        status: DebtStatus.ACTIVE,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/debts`);
    expect(req.request.body.interestRateMonthly).toBeNull();
    expect(req.request.body.minimumPayment).toBeNull();
    expect(req.request.body.installmentAmount).toBeNull();
    expect(req.request.body.totalInstallments).toBeNull();
    expect(req.request.body.remainingInstallments).toBeNull();
    req.flush(debt({ interestRateMonthly: undefined, minimumPayment: undefined }));

    await promise;
  });

  it('should PUT a complete payload merging with the current record', async () => {
    const promise = firstValueFrom(service.update('debt-1', { currentBalance: 8000 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/debts/debt-1`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(debt());

    const putReq = httpMock.expectOne(`${BASE_URL}/debts/debt-1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({
      creditor: 'Bradesco',
      description: 'Cartão de crédito',
      type: 'CREDIT_CARD',
      originalAmount: 12000,
      currentBalance: 8000,
      interestRateMonthly: 12.5,
      minimumPayment: 850,
      installmentAmount: null,
      totalInstallments: null,
      remainingInstallments: null,
      dueDay: 10,
      startDate: '2026-01-01',
      status: 'ACTIVE',
    });
    expect(putReq.request.body.id).toBeUndefined();
    expect(putReq.request.body.createdAt).toBeUndefined();
    expect(putReq.request.body.updatedAt).toBeUndefined();
    putReq.flush(debt({ currentBalance: 8000 }));

    const result = await promise;
    expect(result.currentBalance).toBe(8000);
  });

  it('should DELETE a debt', async () => {
    const promise = firstValueFrom(service.remove('debt-1'));

    const req = httpMock.expectOne(`${BASE_URL}/debts/debt-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });
});
