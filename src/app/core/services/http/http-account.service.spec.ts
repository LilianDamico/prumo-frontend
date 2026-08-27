import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Account, AccountType } from '../../models';
import { HttpAccountService } from './http-account.service';

const BASE_URL = 'http://localhost:8080/api/v1';

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    name: 'Conta corrente',
    institution: 'Banco X',
    type: AccountType.CHECKING,
    currentBalance: 1000,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('HttpAccountService', () => {
  let service: HttpAccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(HttpAccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET the account collection using API_BASE_URL', async () => {
    const promise = firstValueFrom(service.getAll());

    const req = httpMock.expectOne(`${BASE_URL}/accounts`);
    expect(req.request.method).toBe('GET');
    req.flush([account()]);

    const result = await promise;
    expect(result).toEqual([account()]);
  });

  it('should GET an account with institution=null', async () => {
    const promise = firstValueFrom(service.getById('acc-1'));

    const req = httpMock.expectOne(`${BASE_URL}/accounts/acc-1`);
    expect(req.request.method).toBe('GET');
    req.flush(account({ institution: null }));

    const result = await promise;
    expect(result?.institution).toBeNull();
  });

  it('should GET an account with negative currentBalance', async () => {
    const promise = firstValueFrom(service.getById('acc-1'));

    const req = httpMock.expectOne(`${BASE_URL}/accounts/acc-1`);
    req.flush(account({ currentBalance: -350.75 }));

    const result = await promise;
    expect(result?.currentBalance).toBe(-350.75);
  });

  it('should receive createdAt/updatedAt from the backend', async () => {
    const promise = firstValueFrom(service.getById('acc-1'));

    const req = httpMock.expectOne(`${BASE_URL}/accounts/acc-1`);
    req.flush(account());

    const result = await promise;
    expect(result?.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(result?.updatedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should POST to create an account without initialBalance', async () => {
    const promise = firstValueFrom(
      service.create({
        name: 'Conta poupança',
        institution: 'Banco Y',
        type: AccountType.SAVINGS,
        currentBalance: 500,
        active: true,
      }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/accounts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Conta poupança',
      institution: 'Banco Y',
      type: AccountType.SAVINGS,
      currentBalance: 500,
      active: true,
    });
    expect(req.request.body.initialBalance).toBeUndefined();
    req.flush(account({ id: 'acc-2', name: 'Conta poupança', type: AccountType.SAVINGS }));

    const result = await promise;
    expect(result.name).toBe('Conta poupança');
  });

  it('should PUT to update an account, merging with the current record, without initialBalance', async () => {
    const promise = firstValueFrom(service.update('acc-1', { active: false }));

    const getReq = httpMock.expectOne(`${BASE_URL}/accounts/acc-1`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(account());

    const putReq = httpMock.expectOne(`${BASE_URL}/accounts/acc-1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({
      name: 'Conta corrente',
      institution: 'Banco X',
      type: AccountType.CHECKING,
      currentBalance: 1000,
      active: false,
    });
    expect(putReq.request.body.initialBalance).toBeUndefined();
    putReq.flush(account({ active: false }));

    const result = await promise;
    expect(result.active).toBe(false);
  });

  it('should DELETE an account', async () => {
    const promise = firstValueFrom(service.remove('acc-1'));

    const req = httpMock.expectOne(`${BASE_URL}/accounts/acc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should surface a 404 not found error to the caller', async () => {
    const promise = firstValueFrom(service.getById('missing'));

    const req = httpMock.expectOne(`${BASE_URL}/accounts/missing`);
    req.flush(
      {
        timestamp: '2024-01-01T00:00:00Z',
        status: 404,
        error: 'Not Found',
        message: 'Conta não encontrada.',
        path: '/api/v1/accounts/missing',
      },
      { status: 404, statusText: 'Not Found' },
    );

    await expect(promise).rejects.toMatchObject({ status: 404 });
  });
});
