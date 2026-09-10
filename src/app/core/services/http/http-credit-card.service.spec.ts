import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { CreditCard } from '../../models';
import { HttpCreditCardService } from './http-credit-card.service';

const BASE_URL = 'http://localhost:8080/api/v1';

function creditCard(overrides: Partial<CreditCard> = {}): CreditCard {
  return {
    id: 'card-1',
    name: 'Cartão Roxo',
    institution: 'Banco X',
    creditLimit: 5000,
    closingDay: 5,
    dueDay: 15,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('HttpCreditCardService', () => {
  let service: HttpCreditCardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(HttpCreditCardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET the credit card collection without filters', async () => {
    const promise = firstValueFrom(service.getAll());

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([creditCard()]);

    const result = await promise;
    expect(result).toEqual([creditCard()]);
  });

  it('should GET filtering by active=true', async () => {
    const promise = firstValueFrom(service.getAll({ active: true }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/credit-cards` && request.params.get('active') === 'true',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([creditCard()]);

    await promise;
  });

  it('should GET filtering by active=false', async () => {
    const promise = firstValueFrom(service.getAll({ active: false }));

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/credit-cards` && request.params.get('active') === 'false',
    );
    expect(req.request.params.keys().length).toBe(1);
    req.flush([creditCard({ active: false })]);

    await promise;
  });

  it('should not send the active param when it is undefined', async () => {
    const promise = firstValueFrom(service.getAll({}));

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([creditCard()]);

    await promise;
  });

  it('should GET a credit card by id', async () => {
    const promise = firstValueFrom(service.getById('card-1'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    expect(req.request.method).toBe('GET');
    req.flush(creditCard());

    const result = await promise;
    expect(result).toEqual(creditCard());
  });

  it('should propagate a 404 from getById', async () => {
    const promise = firstValueFrom(service.getById('missing'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards/missing`);
    req.flush({ message: 'Cartão não encontrado' }, { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toBeTruthy();
  });

  it('should POST to create a credit card at the right method/URL', async () => {
    const promise = firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 5000,
        closingDay: 5,
        dueDay: 15,
        active: true,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards`);
    expect(req.request.method).toBe('POST');
    req.flush(creditCard());

    const result = await promise;
    expect(result.id).toBe('card-1');
  });

  it('should POST with the exact payload expected by the backend', async () => {
    const promise = firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 5000,
        closingDay: 5,
        dueDay: 15,
        active: true,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards`);
    expect(req.request.body).toEqual({
      name: 'Cartão Roxo',
      institution: 'Banco X',
      creditLimit: 5000,
      closingDay: 5,
      dueDay: 15,
      active: true,
    });
    req.flush(creditCard());

    await promise;
  });

  it('should never send id in the create payload', async () => {
    const promise = firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 5000,
        closingDay: 5,
        dueDay: 15,
        active: true,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards`);
    expect(req.request.body.id).toBeUndefined();
    req.flush(creditCard());

    await promise;
  });

  it('should never send createdAt in the create payload', async () => {
    const promise = firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 5000,
        closingDay: 5,
        dueDay: 15,
        active: true,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards`);
    expect(req.request.body.createdAt).toBeUndefined();
    req.flush(creditCard());

    await promise;
  });

  it('should never send updatedAt in the create payload', async () => {
    const promise = firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 5000,
        closingDay: 5,
        dueDay: 15,
        active: true,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards`);
    expect(req.request.body.updatedAt).toBeUndefined();
    req.flush(creditCard());

    await promise;
  });

  it('should preserve createdAt/updatedAt from the response', async () => {
    const promise = firstValueFrom(service.getById('card-1'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    req.flush(creditCard());

    const result = await promise;
    expect(result?.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(result?.updatedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should GET the current record before PUT on update', async () => {
    const promise = firstValueFrom(service.update('card-1', { creditLimit: 6000 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(creditCard());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    expect(putReq.request.method).toBe('PUT');
    putReq.flush(creditCard({ creditLimit: 6000 }));

    await promise;
  });

  it('should merge partial changes with the current record on update', async () => {
    const promise = firstValueFrom(service.update('card-1', { creditLimit: 6000 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    getReq.flush(creditCard());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    expect(putReq.request.body).toEqual({
      name: 'Cartão Roxo',
      institution: 'Banco X',
      creditLimit: 6000,
      closingDay: 5,
      dueDay: 15,
      active: true,
    });
    putReq.flush(creditCard({ creditLimit: 6000 }));

    const result = await promise;
    expect(result.creditLimit).toBe(6000);
  });

  it('should PUT the complete payload expected by the backend', async () => {
    const promise = firstValueFrom(
      service.update('card-1', {
        name: 'Cartão Azul',
        institution: 'Banco Y',
        creditLimit: 7000,
        closingDay: 10,
        dueDay: 20,
        active: false,
      }),
    );

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    getReq.flush(creditCard());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    expect(putReq.request.body).toEqual({
      name: 'Cartão Azul',
      institution: 'Banco Y',
      creditLimit: 7000,
      closingDay: 10,
      dueDay: 20,
      active: false,
    });
    putReq.flush(creditCard({ name: 'Cartão Azul', institution: 'Banco Y', creditLimit: 7000, closingDay: 10, dueDay: 20, active: false }));

    await promise;
  });

  it('should never send id/createdAt/updatedAt in the PUT payload', async () => {
    const promise = firstValueFrom(service.update('card-1', { creditLimit: 6000 }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    getReq.flush(creditCard());

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    expect(putReq.request.body.id).toBeUndefined();
    expect(putReq.request.body.createdAt).toBeUndefined();
    expect(putReq.request.body.updatedAt).toBeUndefined();
    putReq.flush(creditCard({ creditLimit: 6000 }));

    await promise;
  });

  it('should preserve active=false on update', async () => {
    const promise = firstValueFrom(service.update('card-1', { active: false }));

    const getReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    getReq.flush(creditCard({ active: true }));

    const putReq = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    expect(putReq.request.body.active).toBe(false);
    putReq.flush(creditCard({ active: false }));

    const result = await promise;
    expect(result.active).toBe(false);
  });

  it('should DELETE a credit card', async () => {
    const promise = firstValueFrom(service.remove('card-1'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should propagate a 409 from delete when the card has linked purchases', async () => {
    const promise = firstValueFrom(service.remove('card-1'));

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards/card-1`);
    req.flush(
      { message: 'O cartão não pode ser excluído porque possui compras associadas.' },
      { status: 409, statusText: 'Conflict' },
    );

    await expect(promise).rejects.toBeTruthy();
  });

  it('should not transform creditLimit (sent as-is, no toFixed/Math.round)', async () => {
    const promise = firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 1234.567,
        closingDay: 5,
        dueDay: 15,
        active: true,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards`);
    expect(req.request.body.creditLimit).toBe(1234.567);
    req.flush(creditCard({ creditLimit: 1234.567 }));

    await promise;
  });

  it('should not transform closingDay/dueDay (sent as plain integers)', async () => {
    const promise = firstValueFrom(
      service.create({
        name: 'Cartão Roxo',
        institution: 'Banco X',
        creditLimit: 5000,
        closingDay: 31,
        dueDay: 1,
        active: true,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/credit-cards`);
    expect(req.request.body.closingDay).toBe(31);
    expect(req.request.body.dueDay).toBe(1);
    req.flush(creditCard({ closingDay: 31, dueDay: 1 }));

    await promise;
  });
});
