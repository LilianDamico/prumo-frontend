import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ExpenseStatus } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import { LocalCategoryService } from '../../../core/services/local/local-category.service';
import { ExpensesPage } from './expenses-page';

describe('ExpensesPage', () => {
  let component: ExpensesPage;
  let fixture: ComponentFixture<ExpensesPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ExpensesPage],
      providers: [
        ...CORE_SERVICE_PROVIDERS,
        provideNoopAnimations(),
        // Categorias continuam locais nos testes de componente: eles não
        // exercitam a integração HTTP (coberta em http-category.service.spec.ts)
        // e não devem depender de rede.
        { provide: CategoryService, useClass: LocalCategoryService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra estado vazio quando não há despesas cadastradas', () => {
    expect(component.expenses()).toEqual([]);
  });

  it('cria uma nova despesa a partir do formulário', () => {
    const category = component.categories()[0];
    component.startCreate();
    component.form.setValue({
      description: 'Aluguel',
      amount: 1200,
      dueDate: '2026-01-10',
      paymentDate: '',
      categoryId: category.id,
      accountId: 'conta-teste',
      recurring: true,
      status: ExpenseStatus.PENDING,
    });
    component.save();

    expect(component.expenses().length).toBe(1);
    expect(component.expenses()[0].description).toBe('Aluguel');
  });
});

