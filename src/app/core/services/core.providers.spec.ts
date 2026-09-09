import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { CORE_SERVICE_PROVIDERS } from './core.providers';
import { DebtService } from './debt.service';
import { ExpenseService } from './expense.service';
import { HttpAccountService } from './http/http-account.service';
import { HttpBudgetService } from './http/http-budget.service';
import { HttpCategoryService } from './http/http-category.service';
import { HttpDebtService } from './http/http-debt.service';
import { HttpExpenseService } from './http/http-expense.service';
import { HttpIncomeService } from './http/http-income.service';
import { IncomeService } from './income.service';
import { LocalBudgetService } from './local/local-budget.service';

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
});
