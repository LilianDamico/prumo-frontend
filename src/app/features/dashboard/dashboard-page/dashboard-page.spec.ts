import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountService } from '../../../core/services/account.service';
import { BudgetService } from '../../../core/services/budget.service';
import { CategoryService } from '../../../core/services/category.service';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import { DebtService } from '../../../core/services/debt.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { IncomeService } from '../../../core/services/income.service';
import { LocalAccountService } from '../../../core/services/local/local-account.service';
import { LocalBudgetService } from '../../../core/services/local/local-budget.service';
import { LocalCategoryService } from '../../../core/services/local/local-category.service';
import { LocalDebtService } from '../../../core/services/local/local-debt.service';
import { LocalExpenseService } from '../../../core/services/local/local-expense.service';
import { LocalIncomeService } from '../../../core/services/local/local-income.service';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        ...CORE_SERVICE_PROVIDERS,
        // Categorias, contas, receitas, despesas, dívidas e orçamento
        // continuam locais nos testes de componente: eles não exercitam a
        // integração HTTP (coberta em http-category.service.spec.ts/
        // http-account.service.spec.ts/http-income.service.spec.ts/
        // http-expense.service.spec.ts/http-debt.service.spec.ts/
        // http-budget.service.spec.ts) e não devem depender de rede.
        { provide: CategoryService, useClass: LocalCategoryService },
        { provide: AccountService, useClass: LocalAccountService },
        { provide: IncomeService, useClass: LocalIncomeService },
        { provide: ExpenseService, useClass: LocalExpenseService },
        { provide: DebtService, useClass: LocalDebtService },
        { provide: BudgetService, useClass: LocalBudgetService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
