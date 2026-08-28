import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Expense, ExpenseStatus } from '../../models';
import { HttpExpenseService } from './http-expense.service';

const BASE_URL = 'http://localhost:8080/api/v1';

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    description: 'Aluguel',
    amount: 1500,
    dueDate: '2026-01-10',
    paymentDate: null,
    recurring: true,
    status: ExpenseStatus.PENDING,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('HttpExpenseService', () => {
  let service: HttpExpenseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(HttpExpenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET the expense collection without filters', async () => {
    const promise = firstValueFrom(service.getAll());

    const req = httpMock.expectOne(`${BASE_URL}/expenses`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([expense()]);

    const result = await promise;
    expect(result).toEqual([expense()]);
  });

  it('should GET filtering by accountId', async () => {
    const promise = firstValueFrom(service.getAll({ accountId: 'acc-1' }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/expenses` && request.params.get('accountId') === 'acc-1',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([expense()]);

    await promise;
  });

  it('should GET filtering by categoryId', async () => {
    const promise = firstValueFrom(service.getAll({ categoryId: 'cat-1' }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/expenses` && request.params.get('categoryId') === 'cat-1',
    );
    req.flush([expense()]);

    await promise;
  });

  it('should GET filtering by recurring=true', async () => {
    const promise = firstValueFrom(service.getAll({ recurring: true }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/expenses` && request.params.get('recurring') === 'true',
    );
    req.flush([expense()]);

    await promise;
  });

  it('should GET filtering by recurring=false without confusing it with an absent filter', async () => {
    const promise = firstValueFrom(service.getAll({ recurring: false }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/expenses` && request.params.get('recurring') === 'false',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([expense({ recurring: false })]);

    await promise;
  });

  it('should GET filtering by status', async () => {
    const promise = firstValueFrom(service.getAll({ status: ExpenseStatus.PAID }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/expenses` && request.params.get('status') === 'PAID',
    );
    req.flush([expense({ status: ExpenseStatus.PAID, paymentDate: '2026-01-10' })]);

    await promise;
  });

  it('should GET filtering by from/to', async () => {
    const promise = firstValueFrom(service.getAll({ from: '2026-01-01', to: '2026-01-31' }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/expenses` &&
        request.params.get('from') === '2026-01-01' &&
        request.params.get('to') === '2026-01-31',
    );
    req.flush([expense()]);

    await promise;
  });

  it('should GET an expense by id', async () => {
    const promise = firstValueFrom(service.getById('exp-1'));

    const req = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    expect(req.request.method).toBe('GET');
    req.flush(expense());

    const result = await promise;
    expect(result).toEqual(expense());
  });

  it('should preserve paymentDate as null when the backend returns null', async () => {
    const promise = firstValueFrom(service.getById('exp-1'));

    const req = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    req.flush(expense({ paymentDate: null }));

    const result = await promise;
    expect(result?.paymentDate).toBeNull();
  });

  it('should POST to create an expense without extra fields', async () => {
    const promise = firstValueFrom(
      service.create({
        accountId: 'acc-1',
        categoryId: 'cat-1',
        description: 'Aluguel',
        amount: 1500,
        dueDate: '2026-01-10',
        paymentDate: null,
        recurring: true,
        status: ExpenseStatus.PENDING,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/expenses`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      accountId: 'acc-1',
      categoryId: 'cat-1',
      description: 'Aluguel',
      amount: 1500,
      dueDate: '2026-01-10',
      paymentDate: null,
      recurring: true,
      status: 'PENDING',
    });
    expect(req.request.body.id).toBeUndefined();
    expect(req.request.body.createdAt).toBeUndefined();
    expect(req.request.body.updatedAt).toBeUndefined();
    expect(req.request.body.essential).toBeUndefined();
    req.flush(expense());

    const result = await promise;
    expect(result.id).toBe('exp-1');
  });

  it('should POST with paymentDate filled when status is PAID', async () => {
    const promise = firstValueFrom(
      service.create({
        accountId: 'acc-1',
        categoryId: 'cat-1',
        description: 'Aluguel',
        amount: 1500,
        dueDate: '2026-01-10',
        paymentDate: '2026-01-09',
        recurring: false,
        status: ExpenseStatus.PAID,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/expenses`);
    expect(req.request.body.paymentDate).toBe('2026-01-09');
    expect(req.request.body.status).toBe('PAID');
    req.flush(expense({ status: ExpenseStatus.PAID, paymentDate: '2026-01-09' }));

    await promise;
  });

  it('should PUT a complete payload merging with the current record', async () => {
    const promise = firstValueFrom(service.update('exp-1', { amount: 1600 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(expense());

    const putReq = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({
      accountId: 'acc-1',
      categoryId: 'cat-1',
      description: 'Aluguel',
      amount: 1600,
      dueDate: '2026-01-10',
      paymentDate: null,
      recurring: true,
      status: 'PENDING',
    });
    expect(putReq.request.body.id).toBeUndefined();
    expect(putReq.request.body.createdAt).toBeUndefined();
    expect(putReq.request.body.updatedAt).toBeUndefined();
    putReq.flush(expense({ amount: 1600 }));

    const result = await promise;
    expect(result.amount).toBe(1600);
  });

  it('should PUT explicitly sending paymentDate null when changes clear it', async () => {
    const promise = firstValueFrom(
      service.update('exp-1', { status: ExpenseStatus.PENDING, paymentDate: null }),
    );

    const getReq = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    getReq.flush(expense({ status: ExpenseStatus.PAID, paymentDate: '2026-01-09' }));

    const putReq = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    expect(putReq.request.body.paymentDate).toBeNull();
    expect(putReq.request.body.status).toBe('PENDING');
    putReq.flush(expense({ status: ExpenseStatus.PENDING, paymentDate: null }));

    await promise;
  });

  it('should DELETE an expense', async () => {
    const promise = firstValueFrom(service.remove('exp-1'));

    const req = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should receive createdAt/updatedAt from the backend', async () => {
    const promise = firstValueFrom(service.getById('exp-1'));

    const req = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    req.flush(expense());

    const result = await promise;
    expect(result?.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(result?.updatedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should preserve dueDate as a plain YYYY-MM-DD string', async () => {
    const promise = firstValueFrom(service.getById('exp-1'));

    const req = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    req.flush(expense({ dueDate: '2026-12-31' }));

    const result = await promise;
    expect(result?.dueDate).toBe('2026-12-31');
  });

  it('should preserve paymentDate as a plain YYYY-MM-DD string when present', async () => {
    const promise = firstValueFrom(service.getById('exp-1'));

    const req = httpMock.expectOne(`${BASE_URL}/expenses/exp-1`);
    req.flush(expense({ status: ExpenseStatus.PAID, paymentDate: '2026-12-31' }));

    const result = await promise;
    expect(result?.paymentDate).toBe('2026-12-31');
  });
});
