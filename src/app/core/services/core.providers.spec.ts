import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CategoryService } from './category.service';
import { CORE_SERVICE_PROVIDERS } from './core.providers';
import { HttpCategoryService } from './http/http-category.service';

describe('CORE_SERVICE_PROVIDERS', () => {
  it('should resolve CategoryService to HttpCategoryService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...CORE_SERVICE_PROVIDERS],
    });

    const service = TestBed.inject(CategoryService);

    expect(service).toBeInstanceOf(HttpCategoryService);
  });
});
