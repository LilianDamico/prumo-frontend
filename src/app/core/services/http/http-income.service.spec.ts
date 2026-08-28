import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Income } from '../../models';
import { HttpIncomeService } from './http-income.service';

const BASE_URL = 'http://localhost:8080/api/v1';

function income(overrides: Partial<Income> = {}): Income {
  return {
    id: 'inc-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    description: 'Salário',
    amount: 3000,
    incomeDate: '2026-01-05',
    recurring: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('HttpIncomeService', () => {
  let service: HttpIncomeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(HttpIncomeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET the income collection without filters', async () => {
    const promise = firstValueFrom(service.getAll());

    const req = httpMock.expectOne(`${BASE_URL}/incomes`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([income()]);

    const result = await promise;
    expect(result).toEqual([income()]);
  });

  it('should GET filtering by accountId', async () => {
    const promise = firstValueFrom(service.getAll({ accountId: 'acc-1' }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/incomes` && request.params.get('accountId') === 'acc-1',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([income()]);

    await promise;
  });

  it('should GET filtering by categoryId', async () => {
    const promise = firstValueFrom(service.getAll({ categoryId: 'cat-1' }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/incomes` && request.params.get('categoryId') === 'cat-1',
    );
    req.flush([income()]);

    await promise;
  });

  it('should GET filtering by recurring=true', async () => {
    const promise = firstValueFrom(service.getAll({ recurring: true }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/incomes` && request.params.get('recurring') === 'true',
    );
    req.flush([income()]);

    await promise;
  });

  it('should GET filtering by recurring=false without confusing it with an absent filter', async () => {
    const promise = firstValueFrom(service.getAll({ recurring: false }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/incomes` && request.params.get('recurring') === 'false',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([income({ recurring: false })]);

    await promise;
  });

  it('should GET filtering by from/to', async () => {
    const promise = firstValueFrom(service.getAll({ from: '2026-01-01', to: '2026-01-31' }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/incomes` &&
        request.params.get('from') === '2026-01-01' &&
        request.params.get('to') === '2026-01-31',
    );
    req.flush([income()]);

    await promise;
  });

  it('should GET an income by id', async () => {
    const promise = firstValueFrom(service.getById('inc-1'));

    const req = httpMock.expectOne(`${BASE_URL}/incomes/inc-1`);
    expect(req.request.method).toBe('GET');
    req.flush(income());

    const result = await promise;
    expect(result).toEqual(income());
  });

  it('should POST to create an income without extra fields', async () => {
    const promise = firstValueFrom(
      service.create({
        accountId: 'acc-1',
        categoryId: 'cat-1',
        description: 'Salário',
        amount: 3000,
        incomeDate: '2026-01-05',
        recurring: true,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/incomes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      accountId: 'acc-1',
      categoryId: 'cat-1',
      description: 'Salário',
      amount: 3000,
      incomeDate: '2026-01-05',
      recurring: true,
    });
    expect(req.request.body.id).toBeUndefined();
    expect(req.request.body.createdAt).toBeUndefined();
    expect(req.request.body.updatedAt).toBeUndefined();
    req.flush(income());

    const result = await promise;
    expect(result.id).toBe('inc-1');
  });

  it('should PUT a complete payload merging with the current record', async () => {
    const promise = firstValueFrom(service.update('inc-1', { amount: 3200 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/incomes/inc-1`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(income());

    const putReq = httpMock.expectOne(`${BASE_URL}/incomes/inc-1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({
      accountId: 'acc-1',
      categoryId: 'cat-1',
      description: 'Salário',
      amount: 3200,
      incomeDate: '2026-01-05',
      recurring: true,
    });
    expect(putReq.request.body.id).toBeUndefined();
    expect(putReq.request.body.createdAt).toBeUndefined();
    expect(putReq.request.body.updatedAt).toBeUndefined();
    putReq.flush(income({ amount: 3200 }));

    const result = await promise;
    expect(result.amount).toBe(3200);
  });

  it('should DELETE an income', async () => {
    const promise = firstValueFrom(service.remove('inc-1'));

    const req = httpMock.expectOne(`${BASE_URL}/incomes/inc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should receive createdAt/updatedAt from the backend', async () => {
    const promise = firstValueFrom(service.getById('inc-1'));

    const req = httpMock.expectOne(`${BASE_URL}/incomes/inc-1`);
    req.flush(income());

    const result = await promise;
    expect(result?.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(result?.updatedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should preserve incomeDate as a plain YYYY-MM-DD string', async () => {
    const promise = firstValueFrom(service.getById('inc-1'));

    const req = httpMock.expectOne(`${BASE_URL}/incomes/inc-1`);
    req.flush(income({ incomeDate: '2026-12-31' }));

    const result = await promise;
    expect(result?.incomeDate).toBe('2026-12-31');
  });
});
