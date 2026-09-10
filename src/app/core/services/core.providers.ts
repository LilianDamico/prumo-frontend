import { Provider } from '@angular/core';

import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { CreditCardPurchaseService } from './credit-card-purchase.service';
import { CreditCardService } from './credit-card.service';
import { DebtService } from './debt.service';
import { ExpenseService } from './expense.service';
import { HttpAccountService } from './http/http-account.service';
import { HttpBudgetService } from './http/http-budget.service';
import { HttpCategoryService } from './http/http-category.service';
import { HttpCreditCardPurchaseService } from './http/http-credit-card-purchase.service';
import { HttpCreditCardService } from './http/http-credit-card.service';
import { HttpDebtService } from './http/http-debt.service';
import { HttpExpenseService } from './http/http-expense.service';
import { HttpIncomeService } from './http/http-income.service';
import { IncomeService } from './income.service';

/**
 * Liga cada contrato de serviço de domínio à sua implementação atual.
 * `AccountService`, `CategoryService`, `IncomeService`, `ExpenseService`,
 * `DebtService`, `BudgetService`, `CreditCardService` e
 * `CreditCardPurchaseService` já usam o backend Spring Boot via
 * `HttpAccountService`/`HttpCategoryService`/`HttpIncomeService`/
 * `HttpExpenseService`/`HttpDebtService`/`HttpBudgetService`/
 * `HttpCreditCardService`/`HttpCreditCardPurchaseService`. Quando um novo
 * domínio for integrado, basta trocar o `useClass` — nenhum componente
 * precisará mudar.
 */
export const CORE_SERVICE_PROVIDERS: Provider[] = [
  { provide: AccountService, useClass: HttpAccountService },
  { provide: CategoryService, useClass: HttpCategoryService },
  { provide: IncomeService, useClass: HttpIncomeService },
  { provide: ExpenseService, useClass: HttpExpenseService },
  { provide: DebtService, useClass: HttpDebtService },
  { provide: CreditCardService, useClass: HttpCreditCardService },
  { provide: CreditCardPurchaseService, useClass: HttpCreditCardPurchaseService },
  { provide: BudgetService, useClass: HttpBudgetService },
];

