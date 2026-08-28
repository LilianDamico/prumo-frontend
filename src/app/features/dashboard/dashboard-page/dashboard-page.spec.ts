import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { CORE_SERVICE_PROVIDERS } from '../../../core/services/core.providers';
import { IncomeService } from '../../../core/services/income.service';
import { LocalAccountService } from '../../../core/services/local/local-account.service';
import { LocalCategoryService } from '../../../core/services/local/local-category.service';
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
        // Categorias, contas e receitas continuam locais nos testes de
        // componente: eles não exercitam a integração HTTP (coberta em
        // http-category.service.spec.ts/http-account.service.spec.ts/
        // http-income.service.spec.ts) e não devem depender de rede.
        { provide: CategoryService, useClass: LocalCategoryService },
        { provide: AccountService, useClass: LocalAccountService },
        { provide: IncomeService, useClass: LocalIncomeService },
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
