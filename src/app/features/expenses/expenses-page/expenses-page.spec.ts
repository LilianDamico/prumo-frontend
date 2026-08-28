import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject } from 'rxjs';

import {
  Account,
  AccountType,
  Category,
  CategoryType,
  Expense,
  ExpenseStatus,
} from '../../../core/models';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import {
  CreateExpenseInput,
  ExpenseFilters,
  ExpenseService,
  UpdateExpenseInput,
} from '../../../core/services/expense.service';
import { LocalAccountService } from '../../../core/services/local/local-account.service';
import { LocalCategoryService } from '../../../core/services/local/local-category.service';
import { LocalExpenseService } from '../../../core/services/local/local-expense.service';
import { ExpensesPage } from './expenses-page';

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
    id: 'moradia',
    name: 'Moradia',
    type: CategoryType.EXPENSE,
    active: true,
    essential: true,
    ...overrides,
  };
}

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    accountId: 'conta-teste',
    categoryId: 'moradia',
    description: 'Aluguel',
    amount: 1200,
    dueDate: '2026-01-10',
    paymentDate: null,
    recurring: true,
    status: ExpenseStatus.PENDING,
    ...overrides,
  };
}

/** Dublê de `AccountService`/`CategoryService`/`ExpenseService` cujas emissões são controladas manualmente pelo teste. */
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

class ControlledExpenseService extends ExpenseService {
  readonly subject = new Subject<Expense[]>();
  override getAll(_filters?: ExpenseFilters): Observable<Expense[]> {
    return this.subject.asObservable();
  }
  override getById(): Observable<Expense | undefined> {
    throw new Error('not implemented');
  }
  override create(_input: CreateExpenseInput): Observable<Expense> {
    throw new Error('not implemented');
  }
  override update(_id: string, _changes: UpdateExpenseInput): Observable<Expense> {
    throw new Error('not implemented');
  }
  override remove(): Observable<void> {
    throw new Error('not implemented');
  }
}

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
        // Categorias, contas e despesas continuam locais nos testes de
        // componente: eles não exercitam a integração HTTP (coberta em
        // http-category.service.spec.ts/http-account.service.spec.ts/
        // http-expense.service.spec.ts) e não devem depender de rede.
        { provide: CategoryService, useClass: LocalCategoryService },
        { provide: AccountService, useClass: LocalAccountService },
        { provide: ExpenseService, useClass: LocalExpenseService },
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
    expect(component.expenses()[0].paymentDate).toBeNull();
  });

  it('exibe a data de vencimento sem deslocamento de timezone', () => {
    const category = component.categories()[0];
    component.startCreate();
    component.form.setValue({
      description: 'Aluguel',
      amount: 1200,
      dueDate: '2026-01-01',
      paymentDate: '',
      categoryId: category.id,
      accountId: 'conta-teste',
      recurring: false,
      status: ExpenseStatus.PENDING,
    });
    component.save();

    expect(component.formatIsoDateAsBr(component.expenses()[0].dueDate)).toBe('01/01/2026');
  });

  describe('regra status × paymentDate', () => {
    beforeEach(() => {
      component.startCreate();
    });

    it('exige paymentDate quando status é PAID e habilita o controle', () => {
      component.form.controls.status.setValue(ExpenseStatus.PAID);

      expect(component.form.controls.paymentDate.disabled).toBe(false);
      component.form.controls.paymentDate.setValue('');
      expect(component.form.controls.paymentDate.invalid).toBe(true);
    });

    it('limpa e desabilita paymentDate para PENDING/OVERDUE/CANCELLED', () => {
      component.form.controls.status.setValue(ExpenseStatus.PAID);
      component.form.controls.paymentDate.setValue('2026-01-05');

      component.form.controls.status.setValue(ExpenseStatus.PENDING);
      expect(component.form.controls.paymentDate.disabled).toBe(true);
      expect(component.form.controls.paymentDate.value).toBe('');

      component.form.controls.status.setValue(ExpenseStatus.OVERDUE);
      expect(component.form.controls.paymentDate.disabled).toBe(true);

      component.form.controls.status.setValue(ExpenseStatus.CANCELLED);
      expect(component.form.controls.paymentDate.disabled).toBe(true);
    });

    it('envia paymentDate=null no payload para status não-PAID mesmo que o controle tenha valor residual', () => {
      const category = component.categories()[0];
      component.form.setValue({
        description: 'Conta cancelada',
        amount: 100,
        dueDate: '2026-01-10',
        paymentDate: '',
        categoryId: category.id,
        accountId: 'conta-teste',
        recurring: false,
        status: ExpenseStatus.CANCELLED,
      });
      component.save();

      expect(component.expenses()[0].paymentDate).toBeNull();
      expect(component.expenses()[0].status).toBe(ExpenseStatus.CANCELLED);
    });

    it('envia a data preenchida no payload quando status é PAID', () => {
      const category = component.categories()[0];
      component.form.controls.status.setValue(ExpenseStatus.PAID);
      component.form.patchValue({
        description: 'Conta paga',
        amount: 100,
        dueDate: '2026-01-10',
        categoryId: category.id,
        accountId: 'conta-teste',
        recurring: false,
      });
      component.form.controls.paymentDate.setValue('2026-01-09');
      component.save();

      expect(component.expenses()[0].paymentDate).toBe('2026-01-09');
      expect(component.expenses()[0].status).toBe(ExpenseStatus.PAID);
    });

    it('bloqueia o salvamento quando status é PAID sem paymentDate preenchida', () => {
      const category = component.categories()[0];
      component.form.controls.status.setValue(ExpenseStatus.PAID);
      component.form.patchValue({
        description: 'Conta paga',
        amount: 100,
        dueDate: '2026-01-10',
        categoryId: category.id,
        accountId: 'conta-teste',
        recurring: false,
      });
      component.save();

      expect(component.expenses().length).toBe(0);
      expect(component.form.controls.paymentDate.touched).toBe(true);
    });
  });
});

describe('ExpensesPage (dependências e listas controladas)', () => {
  let component: ExpensesPage;
  let fixture: ComponentFixture<ExpensesPage>;
  let accounts: ControlledAccountService;
  let categories: ControlledCategoryService;
  let expenses: ControlledExpenseService;

  beforeEach(async () => {
    accounts = new ControlledAccountService();
    categories = new ControlledCategoryService();
    expenses = new ControlledExpenseService();

    await TestBed.configureTestingModule({
      imports: [ExpensesPage],
      providers: [
        provideNoopAnimations(),
        { provide: AccountService, useValue: accounts },
        { provide: CategoryService, useValue: categories },
        { provide: ExpenseService, useValue: expenses },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('não considera as dependências carregadas antes de accounts/categories responderem', () => {
    expect(component.dependenciesLoading()).toBe(true);
    expect(component.expensesLoading()).toBe(true);
  });

  it('mantém o carregamento de despesas até a primeira resposta, sem mostrar o estado vazio antes disso', () => {
    expect(component.expensesLoading()).toBe(true);
    expect(component.expenses()).toEqual([]);

    expenses.subject.next([]);

    expect(component.expensesLoading()).toBe(false);
    expect(component.expenses()).toEqual([]);
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

  it('oferece apenas categorias EXPENSE ativas na criação e nunca uma INCOME', () => {
    accounts.subject.next([account()]);
    categories.subject.next([
      category({ id: 'expense-ativa', active: true, type: CategoryType.EXPENSE }),
      category({ id: 'expense-inativa', active: false, type: CategoryType.EXPENSE }),
    ]);

    component.startCreate();

    const ids = component.selectableCategories().map((c) => c.id);
    expect(ids).toEqual(['expense-ativa']);
    expect(component.categories().some((c) => c.type === CategoryType.INCOME)).toBe(false);
  });

  it('preserva a conta inativa já referenciada ao editar', () => {
    accounts.subject.next([account({ id: 'inativa-referenciada', active: false })]);
    categories.subject.next([category()]);
    expenses.subject.next([expense({ accountId: 'inativa-referenciada' })]);

    component.startEdit(expense({ accountId: 'inativa-referenciada' }));

    const ids = component.selectableAccounts().map((a) => a.id);
    expect(ids).toContain('inativa-referenciada');
  });

  it('preserva a categoria EXPENSE inativa já referenciada ao editar', () => {
    accounts.subject.next([account()]);
    categories.subject.next([category({ id: 'inativa-referenciada', active: false })]);

    component.startEdit(expense({ categoryId: 'inativa-referenciada' }));

    const ids = component.selectableCategories().map((c) => c.id);
    expect(ids).toContain('inativa-referenciada');
  });

  it('mantém paymentDate habilitada e preenchida ao editar uma despesa PAID', () => {
    accounts.subject.next([account()]);
    categories.subject.next([category()]);

    component.startEdit(
      expense({ status: ExpenseStatus.PAID, paymentDate: '2026-01-05' }),
    );

    expect(component.form.controls.paymentDate.disabled).toBe(false);
    expect(component.form.controls.paymentDate.value).toBe('2026-01-05');
  });

  it('mantém paymentDate nula/desabilitada ao editar uma despesa não-PAID', () => {
    accounts.subject.next([account()]);
    categories.subject.next([category()]);

    component.startEdit(expense({ status: ExpenseStatus.OVERDUE, paymentDate: null }));

    expect(component.form.controls.paymentDate.disabled).toBe(true);
    expect(component.form.controls.paymentDate.value).toBe('');
  });
});
