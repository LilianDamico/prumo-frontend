import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { SKIP_NOT_FOUND_NOTIFICATION } from '../../interceptors/http-context-tokens';
import { MonthlyBudget } from '../../models';
import { HttpBudgetService } from './http-budget.service';

const BASE_URL = 'http://localhost:8080/api/v1';

function budget(overrides: Partial<MonthlyBudget> = {}): MonthlyBudget {
  return {
    id: 'budget-1',
    referenceMonth: '2026-08',
    expectedIncome: 5000,
    maximumExpenses: 3500,
    debtPaymentTarget: 800,
    emergencyReserveTarget: 300,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

describe('HttpBudgetService', () => {
  let service: HttpBudgetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(HttpBudgetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET the budget collection without filters', async () => {
    const promise = firstValueFrom(service.getAll());

    const req = httpMock.expectOne(`${BASE_URL}/budgets`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([budget()]);

    const result = await promise;
    expect(result).toEqual([budget()]);
  });

  it('should GET filtering by "from"', async () => {
    const promise = firstValueFrom(service.getAll({ from: '2026-01' }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/budgets` && request.params.get('from') === '2026-01',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([budget()]);

    await promise;
  });

  it('should GET filtering by "to"', async () => {
    const promise = firstValueFrom(service.getAll({ to: '2026-12' }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/budgets` && request.params.get('to') === '2026-12',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([budget()]);

    await promise;
  });

  it('should GET combining "from" and "to"', async () => {
    const promise = firstValueFrom(service.getAll({ from: '2026-01', to: '2026-12' }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/budgets` &&
        request.params.get('from') === '2026-01' &&
        request.params.get('to') === '2026-12',
    );
    expect(req.request.params.keys().length).toBe(2);
    req.flush([budget()]);

    await promise;
  });

  it('should not send "from"/"to" params when undefined', async () => {
    const promise = firstValueFrom(service.getAll({}));

    const req = httpMock.expectOne(`${BASE_URL}/budgets`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([budget()]);

    await promise;
  });

  it('should GET a budget by id', async () => {
    const promise = firstValueFrom(service.getById('budget-1'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/budget-1`);
    expect(req.request.method).toBe('GET');
    req.flush(budget());

    const result = await promise;
    expect(result).toEqual(budget());
  });

  it('should propagate a 404 error on getById (not treated as absence)', async () => {
    const promise = firstValueFrom(service.getById('missing'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/missing`);
    req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toBeTruthy();
  });

  it('should GET an existing budget by month', async () => {
    const promise = firstValueFrom(service.getByMonth('2026-08'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/by-month/2026-08`);
    expect(req.request.method).toBe('GET');
    req.flush(budget());

    const result = await promise;
    expect(result).toEqual(budget());
  });

  it('should map a 404 on getByMonth to undefined', async () => {
    const promise = firstValueFrom(service.getByMonth('2026-09'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/by-month/2026-09`);
    req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('should mark the getByMonth request to skip the global not-found notification', async () => {
    const promise = firstValueFrom(service.getByMonth('2026-09'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/by-month/2026-09`);
    expect(req.request.context.get(SKIP_NOT_FOUND_NOTIFICATION)).toBe(true);
    req.flush(budget());

    await promise;
  });

  it('should propagate a non-404 error (e.g. 500) on getByMonth', async () => {
    const promise = firstValueFrom(service.getByMonth('2026-10'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/by-month/2026-10`);
    req.flush({ message: 'server error' }, { status: 500, statusText: 'Internal Server Error' });

    await expect(promise).rejects.toBeTruthy();
  });

  it('should POST to create a budget without id/createdAt/updatedAt', async () => {
    const promise = firstValueFrom(
      service.create({
        referenceMonth: '2026-08',
        expectedIncome: 5000,
        maximumExpenses: 3500,
        debtPaymentTarget: 800,
        emergencyReserveTarget: 300,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/budgets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      referenceMonth: '2026-08',
      expectedIncome: 5000,
      maximumExpenses: 3500,
      debtPaymentTarget: 800,
      emergencyReserveTarget: 300,
    });
    expect(req.request.body.id).toBeUndefined();
    expect(req.request.body.createdAt).toBeUndefined();
    expect(req.request.body.updatedAt).toBeUndefined();
    req.flush(budget());

    const result = await promise;
    expect(result.id).toBe('budget-1');
  });

  it('should PUT a complete payload merging with the current record on update', async () => {
    const promise = firstValueFrom(service.update('budget-1', { emergencyReserveTarget: 500 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/budgets/budget-1`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(budget());

    const putReq = httpMock.expectOne(`${BASE_URL}/budgets/budget-1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({
      referenceMonth: '2026-08',
      expectedIncome: 5000,
      maximumExpenses: 3500,
      debtPaymentTarget: 800,
      emergencyReserveTarget: 500,
    });
    expect(putReq.request.body.id).toBeUndefined();
    expect(putReq.request.body.createdAt).toBeUndefined();
    expect(putReq.request.body.updatedAt).toBeUndefined();
    putReq.flush(budget({ emergencyReserveTarget: 500 }));

    const result = await promise;
    expect(result.emergencyReserveTarget).toBe(500);
  });

  it('should DELETE a budget', async () => {
    const promise = firstValueFrom(service.remove('budget-1'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/budget-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should keep referenceMonth as a plain YYYY-MM string, without Date conversion', async () => {
    const promise = firstValueFrom(service.getById('budget-1'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/budget-1`);
    req.flush(budget({ referenceMonth: '2027-12' }));

    const result = await promise;
    expect(result?.referenceMonth).toBe('2027-12');
  });

  it('should transport debtPaymentTarget without transformation', async () => {
    const promise = firstValueFrom(service.getById('budget-1'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/budget-1`);
    req.flush(budget({ debtPaymentTarget: 1234.56 }));

    const result = await promise;
    expect(result?.debtPaymentTarget).toBe(1234.56);
  });

  it('should transport emergencyReserveTarget without transformation', async () => {
    const promise = firstValueFrom(service.getById('budget-1'));

    const req = httpMock.expectOne(`${BASE_URL}/budgets/budget-1`);
    req.flush(budget({ emergencyReserveTarget: 987.65 }));

    const result = await promise;
    expect(result?.emergencyReserveTarget).toBe(987.65);
  });
});
