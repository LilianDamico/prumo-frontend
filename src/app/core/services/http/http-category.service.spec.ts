import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { Category, CategoryType } from '../../models';
import { HttpCategoryService } from './http-category.service';

const BASE_URL = 'http://localhost:8080/api/v1';

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Moradia',
    type: CategoryType.EXPENSE,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('HttpCategoryService', () => {
  let service: HttpCategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(HttpCategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET the category collection', async () => {
    const promise = firstValueFrom(service.getAll());

    const req = httpMock.expectOne(`${BASE_URL}/categories`);
    expect(req.request.method).toBe('GET');
    req.flush([category()]);

    const result = await promise;
    expect(result).toEqual([category()]);
  });

  it('should GET a category by id', async () => {
    const promise = firstValueFrom(service.getById('cat-1'));

    const req = httpMock.expectOne(`${BASE_URL}/categories/cat-1`);
    expect(req.request.method).toBe('GET');
    req.flush(category());

    const result = await promise;
    expect(result).toEqual(category());
  });

  it('should POST to create a category', async () => {
    const promise = firstValueFrom(
      service.create({ name: 'Educação', type: CategoryType.EXPENSE }),
    );

    const req = httpMock.expectOne(`${BASE_URL}/categories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Educação', type: CategoryType.EXPENSE });
    req.flush(category({ id: 'cat-2', name: 'Educação' }));

    const result = await promise;
    expect(result.name).toBe('Educação');
  });

  it('should PUT to update a category, merging with the current record', async () => {
    const promise = firstValueFrom(service.update('cat-1', { active: false }));

    const getReq = httpMock.expectOne(`${BASE_URL}/categories/cat-1`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(category());

    const putReq = httpMock.expectOne(`${BASE_URL}/categories/cat-1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({
      name: 'Moradia',
      type: CategoryType.EXPENSE,
      active: false,
    });
    putReq.flush(category({ active: false }));

    const result = await promise;
    expect(result.active).toBe(false);
  });

  it('should DELETE a category', async () => {
    const promise = firstValueFrom(service.remove('cat-1'));

    const req = httpMock.expectOne(`${BASE_URL}/categories/cat-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should send "type" as a query param on getByType', async () => {
    const promise = firstValueFrom(service.getByType(CategoryType.INCOME));

    const req = httpMock.expectOne(
      (r) => r.url === `${BASE_URL}/categories` && r.params.get('type') === 'INCOME',
    );
    expect(req.request.method).toBe('GET');
    req.flush([category({ type: CategoryType.INCOME })]);

    const result = await promise;
    expect(result.every((c) => c.type === CategoryType.INCOME)).toBe(true);
  });

  it('should surface a 409 conflict error to the caller', async () => {
    const promise = firstValueFrom(service.create({ name: 'Moradia', type: CategoryType.EXPENSE }));

    const req = httpMock.expectOne(`${BASE_URL}/categories`);
    req.flush(
      {
        timestamp: '2024-01-01T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Categoria já existe.',
        path: '/api/v1/categories',
      },
      { status: 409, statusText: 'Conflict' },
    );

    await expect(promise).rejects.toMatchObject({ status: 409 });
  });
});
