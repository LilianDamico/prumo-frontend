import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./features/accounts/accounts-page/accounts-page').then((m) => m.AccountsPage),
  },
  {
    path: 'incomes',
    loadComponent: () =>
      import('./features/incomes/incomes-page/incomes-page').then((m) => m.IncomesPage),
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./features/expenses/expenses-page/expenses-page').then((m) => m.ExpensesPage),
  },
  {
    path: 'credit-cards',
    loadComponent: () =>
      import('./features/credit-cards/credit-cards-page/credit-cards-page').then(
        (m) => m.CreditCardsPage,
      ),
  },
  {
    path: 'debts',
    loadComponent: () =>
      import('./features/debts/debts-page/debts-page').then((m) => m.DebtsPage),
  },
  {
    path: 'payoff-plan',
    loadComponent: () =>
      import('./features/payoff-plan/payoff-plan-page/payoff-plan-page').then(
        (m) => m.PayoffPlanPage,
      ),
  },
  {
    path: 'purchase-simulator',
    loadComponent: () =>
      import(
        './features/purchase-simulator/purchase-simulator-page/purchase-simulator-page'
      ).then((m) => m.PurchaseSimulatorPage),
  },
  {
    path: 'financial-education',
    loadComponent: () =>
      import(
        './features/financial-education/financial-education-page/financial-education-page'
      ).then((m) => m.FinancialEducationPage),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports-page/reports-page').then((m) => m.ReportsPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings-page/settings-page').then((m) => m.SettingsPage),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
