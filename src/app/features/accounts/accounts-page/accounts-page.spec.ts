import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { API_BASE_URL } from '../../../core/config/api.config';
import { AccountType } from '../../../core/models';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import { AccountsPage } from './accounts-page';

const BASE_URL = 'http://localhost:8080/api/v1';

describe('AccountsPage', () => {
  let component: AccountsPage;
  let fixture: ComponentFixture<AccountsPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        ...CORE_SERVICE_PROVIDERS,
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    httpMock.expectOne(`${BASE_URL}/accounts`).flush([]);
    expect(component).toBeTruthy();
  });

  it('mostra estado vazio quando não há contas cadastradas', () => {
    httpMock.expectOne(`${BASE_URL}/accounts`).flush([]);
    expect(component.accounts()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('cria uma nova conta a partir do formulário', () => {
    httpMock.expectOne(`${BASE_URL}/accounts`).flush([]);

    component.startCreate();
    component.form.setValue({
      name: 'Conta corrente',
      institution: 'Banco X',
      type: AccountType.CHECKING,
      currentBalance: 100,
      active: true,
    });
    component.save();

    const postReq = httpMock.expectOne(`${BASE_URL}/accounts`);
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual({
      name: 'Conta corrente',
      institution: 'Banco X',
      type: AccountType.CHECKING,
      currentBalance: 100,
      active: true,
    });
    postReq.flush({
      id: 'acc-1',
      name: 'Conta corrente',
      institution: 'Banco X',
      type: AccountType.CHECKING,
      currentBalance: 100,
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    httpMock
      .expectOne(`${BASE_URL}/accounts`)
      .flush([
        {
          id: 'acc-1',
          name: 'Conta corrente',
          institution: 'Banco X',
          type: AccountType.CHECKING,
          currentBalance: 100,
          active: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]);

    expect(component.accounts().length).toBe(1);
    expect(component.accounts()[0].name).toBe('Conta corrente');
  });
});

