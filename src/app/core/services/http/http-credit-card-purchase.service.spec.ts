import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { CreditCardPurchase } from '../../models';
import { HttpCreditCardPurchaseService } from './http-credit-card-purchase.service';

const BASE_URL = 'http://localhost:8080/api/v1';

function creditCardPurchase(overrides: Partial<CreditCardPurchase> = {}): CreditCardPurchase {
  return {
    id: 'purchase-1',
    creditCardId: 'card-1',
    categoryId: 'cat-1',
    description: 'Geladeira',
    purchaseDate: '2026-01-10',
    totalAmount: 1200,
    installmentCount: 6,
    installmentAmount: 200,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
    ...overrides,
  };
}

describe('HttpCreditCardPurchaseService', () => {
  let service: HttpCreditCardPurchaseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(HttpCreditCardPurchaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // --- GET ALL -----------------------------------------------------------

  it('should GET the collection without filters', async () => {
    const promise = firstValueFrom(service.getAll());

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([creditCardPurchase()]);

    const result = await promise;
    expect(result).toEqual([creditCardPurchase()]);
  });

  it('should filter by creditCardId', async () => {
    const promise = firstValueFrom(service.getAll({ creditCardId: 'card-1' }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/credit-card-purchases` && request.params.get('creditCardId') === 'card-1',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([creditCardPurchase()]);

    await promise;
  });

  it('should filter by categoryId', async () => {
    const promise = firstValueFrom(service.getAll({ categoryId: 'cat-1' }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/credit-card-purchases` && request.params.get('categoryId') === 'cat-1',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([creditCardPurchase()]);

    await promise;
  });

  it('should filter by installmentCount', async () => {
    const promise = firstValueFrom(service.getAll({ installmentCount: 6 }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/credit-card-purchases` && request.params.get('installmentCount') === '6',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([creditCardPurchase()]);

    await promise;
  });

  it('should filter by from', async () => {
    const promise = firstValueFrom(service.getAll({ from: '2026-01-01' }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/credit-card-purchases` && request.params.get('from') === '2026-01-01',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([creditCardPurchase()]);

    await promise;
  });

  it('should filter by to', async () => {
    const promise = firstValueFrom(service.getAll({ to: '2026-12-31' }));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/credit-card-purchases` && request.params.get('to') === '2026-12-31',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([creditCardPurchase()]);

    await promise;
  });

  it('should combine multiple filters in a single request', async () => {
    const promise = firstValueFrom(
      service.getAll({ creditCardId: 'card-1', categoryId: 'cat-1', from: '2026-01-01', to: '2026-12-31' }),
    );

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/credit-card-purchases` &&
        request.params.get('creditCardId') === 'card-1' &&
        request.params.get('categoryId') === 'cat-1' &&
        request.params.get('from') === '2026-01-01' &&
        request.params.get('to') === '2026-12-31',
    );
    expect(req.request.params.keys().length).toBe(4);
    req.flush([creditCardPurchase()]);

    await promise;
  });

  it('should not send any query param when filters are undefined', async () => {
    const promise = firstValueFrom(service.getAll());

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([creditCardPurchase()]);

    await promise;
  });

  it('should not send any query param when filters is an empty object', async () => {
    const promise = firstValueFrom(service.getAll({}));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([creditCardPurchase()]);

    await promise;
  });

  it('should send installmentCount=1 correctly', async () => {
    const promise = firstValueFrom(service.getAll({ installmentCount: 1 }));

    const req = httpMock.expectOne(
      (request) => request.params.get('installmentCount') === '1',
    );
    req.flush([creditCardPurchase({ installmentCount: 1 })]);

    await promise;
  });

  it('should send installmentCount=99 correctly', async () => {
    const promise = firstValueFrom(service.getAll({ installmentCount: 99 }));

    const req = httpMock.expectOne(
      (request) => request.params.get('installmentCount') === '99',
    );
    req.flush([creditCardPurchase({ installmentCount: 99 })]);

    await promise;
  });

  // --- GET BY ID -----------------------------------------------------------

  it('should GET a purchase by id', async () => {
    const promise = firstValueFrom(service.getById('purchase-1'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(req.request.method).toBe('GET');
    req.flush(creditCardPurchase());

    const result = await promise;
    expect(result).toEqual(creditCardPurchase());
  });

  it('should propagate a 404 from getById', async () => {
    const promise = firstValueFrom(service.getById('missing'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/missing`);
    req.flush({ message: 'Compra não encontrada' }, { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toBeTruthy();
  });

  // --- GET BY CARD -----------------------------------------------------------

  it('should implement getByCard using the creditCardId query param', async () => {
    const promise = firstValueFrom(service.getByCard('card-1'));

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/credit-card-purchases` && request.params.get('creditCardId') === 'card-1',
    );
    req.flush([creditCardPurchase()]);

    await promise;
  });

  it('should not invent a dedicated by-card endpoint', async () => {
    const promise = firstValueFrom(service.getByCard('card-1'));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/credit-card-purchases`,
    );
    expect(req.request.url).not.toContain('by-card');
    req.flush([creditCardPurchase()]);

    await promise;
  });

  // --- CREATE -----------------------------------------------------------

  const createInput = {
    creditCardId: 'card-1',
    categoryId: 'cat-1',
    description: 'Geladeira',
    purchaseDate: '2026-01-10',
    totalAmount: 1200,
    installmentCount: 6,
  };

  it('should POST to the correct URL', async () => {
    const promise = firstValueFrom(service.create(createInput));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.method).toBe('POST');
    req.flush(creditCardPurchase());

    await promise;
  });

  it('should POST with the exact payload expected by the backend', async () => {
    const promise = firstValueFrom(service.create(createInput));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.body).toEqual(createInput);
    req.flush(creditCardPurchase());

    await promise;
  });

  it('should never send id in the create payload', async () => {
    const promise = firstValueFrom(service.create(createInput));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.body.id).toBeUndefined();
    req.flush(creditCardPurchase());

    await promise;
  });

  it('should never send installmentAmount in the create payload', async () => {
    const promise = firstValueFrom(service.create(createInput));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.body.installmentAmount).toBeUndefined();
    req.flush(creditCardPurchase());

    await promise;
  });

  it('should never send createdAt in the create payload', async () => {
    const promise = firstValueFrom(service.create(createInput));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.body.createdAt).toBeUndefined();
    req.flush(creditCardPurchase());

    await promise;
  });

  it('should never send updatedAt in the create payload', async () => {
    const promise = firstValueFrom(service.create(createInput));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.body.updatedAt).toBeUndefined();
    req.flush(creditCardPurchase());

    await promise;
  });

  it('should preserve installmentAmount from the response', async () => {
    const promise = firstValueFrom(service.create(createInput));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    req.flush(creditCardPurchase({ installmentAmount: 200 }));

    const result = await promise;
    expect(result.installmentAmount).toBe(200);
  });

  it('should preserve createdAt/updatedAt from the response', async () => {
    const promise = firstValueFrom(service.create(createInput));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    req.flush(creditCardPurchase());

    const result = await promise;
    expect(result.createdAt).toBe('2026-01-10T00:00:00Z');
    expect(result.updatedAt).toBe('2026-01-10T00:00:00Z');
  });

  // --- UPDATE -----------------------------------------------------------

  it('should GET the current record before PUT on update', async () => {
    const promise = firstValueFrom(service.update('purchase-1', { totalAmount: 1500 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(putReq.request.method).toBe('PUT');
    putReq.flush(creditCardPurchase({ totalAmount: 1500 }));

    await promise;
  });

  it('should merge partial changes with the current record', async () => {
    const promise = firstValueFrom(service.update('purchase-1', { totalAmount: 1500 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(putReq.request.body).toEqual({
      creditCardId: 'card-1',
      categoryId: 'cat-1',
      description: 'Geladeira',
      purchaseDate: '2026-01-10',
      totalAmount: 1500,
      installmentCount: 6,
    });
    putReq.flush(creditCardPurchase({ totalAmount: 1500 }));

    await promise;
  });

  it('should PUT the complete payload expected by the backend', async () => {
    const promise = firstValueFrom(
      service.update('purchase-1', {
        creditCardId: 'card-2',
        categoryId: 'cat-2',
        description: 'Notebook',
        purchaseDate: '2026-02-20',
        totalAmount: 3000,
        installmentCount: 12,
      }),
    );

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(putReq.request.body).toEqual({
      creditCardId: 'card-2',
      categoryId: 'cat-2',
      description: 'Notebook',
      purchaseDate: '2026-02-20',
      totalAmount: 3000,
      installmentCount: 12,
    });
    putReq.flush(
      creditCardPurchase({
        creditCardId: 'card-2',
        categoryId: 'cat-2',
        description: 'Notebook',
        purchaseDate: '2026-02-20',
        totalAmount: 3000,
        installmentCount: 12,
      }),
    );

    await promise;
  });

  it('should never send id/installmentAmount/createdAt/updatedAt in the PUT payload', async () => {
    const promise = firstValueFrom(service.update('purchase-1', { totalAmount: 1500 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(putReq.request.body.id).toBeUndefined();
    expect(putReq.request.body.installmentAmount).toBeUndefined();
    expect(putReq.request.body.createdAt).toBeUndefined();
    expect(putReq.request.body.updatedAt).toBeUndefined();
    putReq.flush(creditCardPurchase({ totalAmount: 1500 }));

    await promise;
  });

  it('should change creditCardId correctly on update', async () => {
    const promise = firstValueFrom(service.update('purchase-1', { creditCardId: 'card-2' }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(putReq.request.body.creditCardId).toBe('card-2');
    putReq.flush(creditCardPurchase({ creditCardId: 'card-2' }));

    const result = await promise;
    expect(result.creditCardId).toBe('card-2');
  });

  it('should change categoryId correctly on update', async () => {
    const promise = firstValueFrom(service.update('purchase-1', { categoryId: 'cat-2' }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(putReq.request.body.categoryId).toBe('cat-2');
    putReq.flush(creditCardPurchase({ categoryId: 'cat-2' }));

    const result = await promise;
    expect(result.categoryId).toBe('cat-2');
  });

  it('should change totalAmount correctly on update', async () => {
    const promise = firstValueFrom(service.update('purchase-1', { totalAmount: 999.9 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(putReq.request.body.totalAmount).toBe(999.9);
    putReq.flush(creditCardPurchase({ totalAmount: 999.9 }));

    const result = await promise;
    expect(result.totalAmount).toBe(999.9);
  });

  it('should change installmentCount correctly on update', async () => {
    const promise = firstValueFrom(service.update('purchase-1', { installmentCount: 3 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(putReq.request.body.installmentCount).toBe(3);
    putReq.flush(creditCardPurchase({ installmentCount: 3 }));

    const result = await promise;
    expect(result.installmentCount).toBe(3);
  });

  it('should preserve fields not present in changes', async () => {
    const promise = firstValueFrom(service.update('purchase-1', { totalAmount: 1500 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(putReq.request.body.description).toBe('Geladeira');
    expect(putReq.request.body.categoryId).toBe('cat-1');
    expect(putReq.request.body.creditCardId).toBe('card-1');
    putReq.flush(creditCardPurchase({ totalAmount: 1500 }));

    await promise;
  });

  it('should keep installmentAmount/timestamps from the update response', async () => {
    const promise = firstValueFrom(service.update('purchase-1', { totalAmount: 1500 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    getReq.flush(creditCardPurchase());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    putReq.flush(
      creditCardPurchase({ totalAmount: 1500, installmentAmount: 250, updatedAt: '2026-03-01T00:00:00Z' }),
    );

    const result = await promise;
    expect(result.installmentAmount).toBe(250);
    expect(result.updatedAt).toBe('2026-03-01T00:00:00Z');
  });

  // --- DELETE -----------------------------------------------------------

  it('should DELETE at the correct URL', async () => {
    const promise = firstValueFrom(service.remove('purchase-1'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should propagate a 404 from delete', async () => {
    const promise = firstValueFrom(service.remove('missing'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/missing`);
    req.flush({ message: 'Compra não encontrada' }, { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toBeTruthy();
  });

  it('should propagate a 409 conflict from delete', async () => {
    const promise = firstValueFrom(service.remove('purchase-1'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases/purchase-1`);
    req.flush({ message: 'Conflito' }, { status: 409, statusText: 'Conflict' });

    await expect(promise).rejects.toBeTruthy();
  });

  // --- MONEY / DATE -----------------------------------------------------------

  it('should send totalAmount as a decimal without any transformation', async () => {
    const promise = firstValueFrom(service.create({ ...createInput, totalAmount: 1234.567 }));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.body.totalAmount).toBe(1234.567);
    req.flush(creditCardPurchase({ totalAmount: 1234.567 }));

    await promise;
  });

  it('should send purchaseDate literally, without timezone conversion', async () => {
    const promise = firstValueFrom(service.create({ ...createInput, purchaseDate: '2026-09-10' }));

    const req = httpMock.expectOne(`${BASE_URL}/credit-card-purchases`);
    expect(req.request.body.purchaseDate).toBe('2026-09-10');
    req.flush(creditCardPurchase({ purchaseDate: '2026-09-10' }));

    await promise;
  });
});
