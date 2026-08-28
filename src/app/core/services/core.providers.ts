import { Provider } from '@angular/core';

import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { CreditCardPurchaseService } from './credit-card-purchase.service';
import { CreditCardService } from './credit-card.service';
import { DebtService } from './debt.service';
import { ExpenseService } from './expense.service';
import { HttpAccountService } from './http/http-account.service';
import { HttpCategoryService } from './http/http-category.service';
import { HttpExpenseService } from './http/http-expense.service';
import { HttpIncomeService } from './http/http-income.service';
import { IncomeService } from './income.service';
import { LocalBudgetService } from './local/local-budget.service';
import { LocalCreditCardPurchaseService } from './local/local-credit-card-purchase.service';
import { LocalCreditCardService } from './local/local-credit-card.service';
import { LocalDebtService } from './local/local-debt.service';

/**
 * Liga cada contrato de serviço de domínio à sua implementação atual.
 * `AccountService`, `CategoryService`, `IncomeService` e `ExpenseService` já
 * usam o backend Spring Boot via `HttpAccountService`/`HttpCategoryService`/
 * `HttpIncomeService`/`HttpExpenseService`; os demais domínios continuam em
 * `localStorage` até serem integrados em etapas futuras. Quando isso
 * acontecer, basta trocar o `useClass` de cada entrada — nenhum componente
 * precisará mudar.
 */
export const CORE_SERVICE_PROVIDERS: Provider[] = [
  { provide: AccountService, useClass: HttpAccountService },
  { provide: CategoryService, useClass: HttpCategoryService },
  { provide: IncomeService, useClass: HttpIncomeService },
  { provide: ExpenseService, useClass: HttpExpenseService },
  { provide: DebtService, useClass: LocalDebtService },
  { provide: CreditCardService, useClass: LocalCreditCardService },
  { provide: CreditCardPurchaseService, useClass: LocalCreditCardPurchaseService },
  { provide: BudgetService, useClass: LocalBudgetService },
];

