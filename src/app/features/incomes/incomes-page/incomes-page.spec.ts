import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject } from 'rxjs';

import { Account, AccountType, Category, CategoryType, Income } from '../../../core/models';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import {
  CreateIncomeInput,
  IncomeFilters,
  IncomeService,
  UpdateIncomeInput,
} from '../../../core/services/income.service';
import { LocalAccountService } from '../../../core/services/local/local-account.service';
import { LocalCategoryService } from '../../../core/services/local/local-category.service';
import { LocalIncomeService } from '../../../core/services/local/local-income.service';
import { IncomesPage } from './incomes-page';

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'conta-teste',
    name: 'Conta corrente',
    institution: 'Banco X',
    type: AccountType.CHECKING,
    currentBalance: 1000,
    active: true,
    ...overrides,
  };
}

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'salario',
    name: 'Salário',
    type: CategoryType.INCOME,
    active: true,
    essential: false,
    ...overrides,
  };
}

function income(overrides: Partial<Income> = {}): Income {
  return {
    id: 'inc-1',
    accountId: 'conta-teste',
    categoryId: 'salario',
    description: 'Salário',
    amount: 3000,
    incomeDate: '2026-01-05',
    recurring: true,
    ...overrides,
  };
}

/** Dublê de `AccountService`/`CategoryService`/`IncomeService` cujas emissões são controladas manualmente pelo teste. */
class ControlledAccountService extends AccountService {
  readonly subject = new Subject<Account[]>();
  override getAll(): Observable<Account[]> {
    return this.subject.asObservable();
  }
  override getById(): Observable<Account | undefined> {
    throw new Error('not implemented');
  }
  override create(): Observable<Account> {
    throw new Error('not implemented');
  }
  override update(): Observable<Account> {
    throw new Error('not implemented');
  }
  override remove(): Observable<void> {
    throw new Error('not implemented');
  }
}

class ControlledCategoryService extends CategoryService {
  readonly subject = new Subject<Category[]>();
  override getAll(): Observable<Category[]> {
    return this.subject.asObservable();
  }
  override getByType(): Observable<Category[]> {
    return this.subject.asObservable();
  }
  override getById(): Observable<Category | undefined> {
    throw new Error('not implemented');
  }
  override create(): Observable<Category> {
    throw new Error('not implemented');
  }
  override update(): Observable<Category> {
    throw new Error('not implemented');
  }
  override remove(): Observable<void> {
    throw new Error('not implemented');
  }
}

class ControlledIncomeService extends IncomeService {
  readonly subject = new Subject<Income[]>();
  override getAll(_filters?: IncomeFilters): Observable<Income[]> {
    return this.subject.asObservable();
  }
  override getById(): Observable<Income | undefined> {
    throw new Error('not implemented');
  }
  override create(_input: CreateIncomeInput): Observable<Income> {
    throw new Error('not implemented');
  }
  override update(_id: string, _changes: UpdateIncomeInput): Observable<Income> {
    throw new Error('not implemented');
  }
  override remove(): Observable<void> {
    throw new Error('not implemented');
  }
}

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
        // Categorias e contas continuam locais nos testes de componente: eles
        // não exercitam a integração HTTP (coberta em
        // http-category.service.spec.ts/http-account.service.spec.ts) e não
        // devem depender de rede.
        { provide: CategoryService, useClass: LocalCategoryService },
        { provide: AccountService, useClass: LocalAccountService },
        { provide: IncomeService, useClass: LocalIncomeService },
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

  it('exibe a data da receita sem deslocamento de timezone', () => {
    const category = component.categories()[0];
    component.startCreate();
    component.form.setValue({
      description: 'Salário',
      amount: 3000,
      incomeDate: '2026-01-01',
      categoryId: category.id,
      accountId: 'conta-teste',
      recurring: false,
    });
    component.save();

    expect(component.formatIsoDateAsBr(component.incomes()[0].incomeDate)).toBe('01/01/2026');
  });
});

describe('IncomesPage (dependências e listas controladas)', () => {
  let component: IncomesPage;
  let fixture: ComponentFixture<IncomesPage>;
  let accounts: ControlledAccountService;
  let categories: ControlledCategoryService;
  let incomes: ControlledIncomeService;

  beforeEach(async () => {
    accounts = new ControlledAccountService();
    categories = new ControlledCategoryService();
    incomes = new ControlledIncomeService();

    await TestBed.configureTestingModule({
      imports: [IncomesPage],
      providers: [
        provideNoopAnimations(),
        { provide: AccountService, useValue: accounts },
        { provide: CategoryService, useValue: categories },
        { provide: IncomeService, useValue: incomes },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('não considera as dependências carregadas antes de accounts/categories responderem', () => {
    expect(component.dependenciesLoading()).toBe(true);
    expect(component.incomesLoading()).toBe(true);
  });

  it('mantém o carregamento de receitas até a primeira resposta, sem mostrar o estado vazio antes disso', () => {
    expect(component.incomesLoading()).toBe(true);
    expect(component.incomes()).toEqual([]);

    incomes.subject.next([]);

    expect(component.incomesLoading()).toBe(false);
    expect(component.incomes()).toEqual([]);
  });

  it('startCreate não abre o formulário enquanto as dependências ainda carregam', () => {
    component.startCreate();
    expect(component.showForm()).toBe(false);
  });

  it('libera o formulário assim que accounts e categories responderem', () => {
    accounts.subject.next([account()]);
    categories.subject.next([category()]);

    expect(component.dependenciesLoading()).toBe(false);

    component.startCreate();
    expect(component.showForm()).toBe(true);
  });

  it('oferece apenas contas ativas na criação', () => {
    accounts.subject.next([
      account({ id: 'ativa', active: true }),
      account({ id: 'inativa', active: false }),
    ]);
    categories.subject.next([category()]);

    component.startCreate();

    const ids = component.selectableAccounts().map((a) => a.id);
    expect(ids).toEqual(['ativa']);
  });

  it('oferece apenas categorias INCOME ativas na criação e nunca uma EXPENSE', () => {
    accounts.subject.next([account()]);
    categories.subject.next([
      category({ id: 'income-ativa', active: true, type: CategoryType.INCOME }),
      category({ id: 'income-inativa', active: false, type: CategoryType.INCOME }),
    ]);

    component.startCreate();

    const ids = component.selectableCategories().map((c) => c.id);
    expect(ids).toEqual(['income-ativa']);
    expect(component.categories().some((c) => c.type === CategoryType.EXPENSE)).toBe(false);
  });

  it('preserva a conta inativa já referenciada ao editar', () => {
    accounts.subject.next([account({ id: 'inativa-referenciada', active: false })]);
    categories.subject.next([category()]);
    incomes.subject.next([income({ accountId: 'inativa-referenciada' })]);

    component.startEdit(income({ accountId: 'inativa-referenciada' }));

    const ids = component.selectableAccounts().map((a) => a.id);
    expect(ids).toContain('inativa-referenciada');
  });

  it('preserva a categoria INCOME inativa já referenciada ao editar', () => {
    accounts.subject.next([account()]);
    categories.subject.next([category({ id: 'inativa-referenciada', active: false })]);

    component.startEdit(income({ categoryId: 'inativa-referenciada' }));

    const ids = component.selectableCategories().map((c) => c.id);
    expect(ids).toContain('inativa-referenciada');
  });
});

