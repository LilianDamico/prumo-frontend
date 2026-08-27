import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CategoryService } from '../../../core/services/category.service';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import { LocalCategoryService } from '../../../core/services/local/local-category.service';
import { IncomesPage } from './incomes-page';

describe('IncomesPage', () => {
  let component: IncomesPage;
  let fixture: ComponentFixture<IncomesPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [IncomesPage],
      providers: [
        ...CORE_SERVICE_PROVIDERS,
        provideNoopAnimations(),
        // Categorias continuam locais nos testes de componente: eles não
        // exercitam a integração HTTP (coberta em http-category.service.spec.ts)
        // e não devem depender de rede.
        { provide: CategoryService, useClass: LocalCategoryService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra estado vazio quando não há receitas cadastradas', () => {
    expect(component.incomes()).toEqual([]);
  });

  it('cria uma nova receita a partir do formulário', () => {
    const category = component.categories()[0];
    component.startCreate();
    component.form.setValue({
      description: 'Salário',
      amount: 3000,
      incomeDate: '2026-01-05',
      categoryId: category.id,
      accountId: 'conta-teste',
      recurring: true,
    });
    component.save();

    expect(component.incomes().length).toBe(1);
    expect(component.incomes()[0].description).toBe('Salário');
  });
});

