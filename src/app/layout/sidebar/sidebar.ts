import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Painel', path: '/dashboard', icon: 'dashboard' },
  { label: 'Contas', path: '/accounts', icon: 'account_balance' },
  { label: 'Receitas', path: '/incomes', icon: 'payments' },
  { label: 'Despesas', path: '/expenses', icon: 'receipt_long' },
  { label: 'Cartões', path: '/credit-cards', icon: 'credit_card' },
  { label: 'Dívidas', path: '/debts', icon: 'account_balance_wallet' },
  { label: 'Meu Caminho', path: '/payoff-plan', icon: 'route' },
  { label: 'Posso comprar?', path: '/purchase-simulator', icon: 'shopping_cart' },
  { label: 'Me explica', path: '/financial-education', icon: 'menu_book' },
  { label: 'Relatórios', path: '/reports', icon: 'bar_chart' },
  { label: 'Configurações', path: '/settings', icon: 'settings' },
];

/**
 * Navegação principal do Prumo. Usada tanto na barra lateral fixa (desktop)
 * quanto na gaveta de navegação em telas menores.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatListModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly navItems = NAV_ITEMS;
}
