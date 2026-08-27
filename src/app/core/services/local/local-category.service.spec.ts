import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { CategoryType } from '../../models';
import { LocalCategoryService } from './local-category.service';

describe('LocalCategoryService', () => {
  let service: LocalCategoryService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalCategoryService);
  });

  it('should seed the default categories on first access', async () => {
    const categories = await firstValueFrom(service.getAll());
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c) => c.name === 'Moradia' && c.essential)).toBe(true);
    expect(categories.some((c) => c.name === 'Lazer' && !c.essential)).toBe(true);
    expect(categories.some((c) => c.name === 'Salário' && c.type === CategoryType.INCOME)).toBe(
      true,
    );
  });

  it('should not duplicate the seed on subsequent reads', async () => {
    const first = await firstValueFrom(service.getAll());
    const second = await firstValueFrom(service.getAll());
    expect(second.length).toBe(first.length);
  });

  it('should filter categories by type', async () => {
    const incomeCategories = await firstValueFrom(service.getByType(CategoryType.INCOME));
    expect(incomeCategories.every((c) => c.type === CategoryType.INCOME)).toBe(true);
    expect(incomeCategories.length).toBe(4);
  });

  it('should allow creating a custom category', async () => {
    const created = await firstValueFrom(
      service.create({ name: 'Educação', type: CategoryType.EXPENSE, essential: true }),
    );
    expect(created.id).toBeTruthy();
    const all = await firstValueFrom(service.getAll());
    expect(all.some((c) => c.id === created.id)).toBe(true);
  });
});
