import { Debt, DebtType, DebtStatus } from '../models';
import { AvalancheStrategy, SnowballStrategy } from './debt-strategy';

function debt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'debt-1',
    creditor: 'Banco X',
    description: 'Empréstimo',
    type: DebtType.PERSONAL_LOAN,
    originalAmount: 1000,
    currentBalance: 800,
    dueDay: 15,
    startDate: '2026-01-01',
    status: DebtStatus.ACTIVE,
    ...overrides,
  };
}

describe('AvalancheStrategy', () => {
  it('ordena dívidas por maior taxa de juros conhecida primeiro', () => {
    const strategy = new AvalancheStrategy();
    const debts = [
      debt({ id: 'a', interestRateMonthly: 5 }),
      debt({ id: 'b', interestRateMonthly: 12 }),
      debt({ id: 'c', interestRateMonthly: 8 }),
    ];

    const ordered = strategy.order(debts);
    expect(ordered.map((d) => d.id)).toEqual(['b', 'c', 'a']);
  });

  it('coloca dívidas sem taxa conhecida por último, sem inventar valor', () => {
    const strategy = new AvalancheStrategy();
    const debts = [
      debt({ id: 'known', interestRateMonthly: 5 }),
      debt({ id: 'unknown' }),
    ];

    const ordered = strategy.order(debts);
    expect(ordered.map((d) => d.id)).toEqual(['known', 'unknown']);
  });
});

describe('SnowballStrategy', () => {
  it('ordena dívidas por menor saldo atual primeiro', () => {
    const strategy = new SnowballStrategy();
    const debts = [
      debt({ id: 'a', currentBalance: 500 }),
      debt({ id: 'b', currentBalance: 100 }),
      debt({ id: 'c', currentBalance: 900 }),
    ];

    const ordered = strategy.order(debts);
    expect(ordered.map((d) => d.id)).toEqual(['b', 'a', 'c']);
  });
});
