import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { CORE_SERVICE_PROVIDERS } from './core.providers';
import { CreditCardPurchaseService } from './credit-card-purchase.service';
import { CreditCardService } from './credit-card.service';
import { DebtService } from './debt.service';
import { ExpenseService } from './expense.service';
import { HttpAccountService } from './http/http-account.service';
import { HttpBudgetService } from './http/http-budget.service';
import { HttpCategoryService } from './http/http-category.service';
import { HttpCreditCardPurchaseService } from './http/http-credit-card-purchase.service';
import { HttpCreditCardService } from './http/http-credit-card.service';
import { HttpDebtService } from './http/http-debt.service';
import { HttpExpenseService } from './http/http-expense.service';
import { HttpIncomeService } from './http/http-income.service';
import { IncomeService } from './income.service';
import { LocalBudgetService } from './local/local-budget.service';
import { LocalCreditCardPurchaseService } from './local/local-credit-card-purchase.service';
import { LocalCreditCardService } from './local/local-credit-card.service';

describe('CORE_SERVICE_PROVIDERS', () => {
  it('should resolve AccountService to HttpAccountService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...CORE_SERVICE_PROVIDERS],
    });

    const service = TestBed.inject(AccountService);

    expect(service).toBeInstanceOf(HttpAccountService);
  });

  it('should resolve CategoryService to HttpCategoryService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...CORE_SERVICE_PROVIDERS],
    });

    const service = TestBed.inject(CategoryService);

    expect(service).toBeInstanceOf(HttpCategoryService);
  });

  it('should resolve IncomeService to HttpIncomeService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...CORE_SERVICE_PROVIDERS],
    });

    const service = TestBed.inject(IncomeService);

    expect(service).toBeInstanceOf(HttpIncomeService);
  });

  it('should resolve ExpenseService to HttpExpenseService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...CORE_SERVICE_PROVIDERS],
    });

    const service = TestBed.inject(ExpenseService);

    expect(service).toBeInstanceOf(HttpExpenseService);
  });

  it('should resolve DebtService to HttpDebtService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...CORE_SERVICE_PROVIDERS],
    });

    const service = TestBed.inject(DebtService);

    expect(service).toBeInstanceOf(HttpDebtService);
  });

  it('should resolve BudgetService to HttpBudgetService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...CORE_SERVICE_PROVIDERS],
    });

    const service = TestBed.inject(BudgetService);

    expect(service).toBeInstanceOf(HttpBudgetService);
    expect(service).not.toBeInstanceOf(LocalBudgetService);
  });

  it('should resolve CreditCardService to HttpCreditCardService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...CORE_SERVICE_PROVIDERS],
    });

    const service = TestBed.inject(CreditCardService);

    expect(service).toBeInstanceOf(HttpCreditCardService);
    expect(service).not.toBeInstanceOf(LocalCreditCardService);
  });

  it('should resolve CreditCardPurchaseService to HttpCreditCardPurchaseService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...CORE_SERVICE_PROVIDERS],
    });

    const service = TestBed.inject(CreditCardPurchaseService);

    expect(service).toBeInstanceOf(HttpCreditCardPurchaseService);
    expect(service).not.toBeInstanceOf(LocalCreditCardPurchaseService);
  });
});
