import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AccountService } from './account.service';
import { CategoryService } from './category.service';
import { CORE_SERVICE_PROVIDERS } from './core.providers';
import { HttpAccountService } from './http/http-account.service';
import { HttpCategoryService } from './http/http-category.service';
import { HttpIncomeService } from './http/http-income.service';
import { IncomeService } from './income.service';

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
});
