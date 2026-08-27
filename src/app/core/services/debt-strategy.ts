import { Debt } from '../models';
import { DebtPayoffStrategyType } from '../models';

/**
 * Estratégia de priorização de dívidas para "Meu Caminho". Cada estratégia
 * apenas ordena as dívidas ativas; nunca inventa taxas de juros nem decide
 * pelo usuário.
 */
export interface DebtStrategy {
  readonly type: DebtPayoffStrategyType;
  /** Nome simples, em linguagem comum, mostrado como título principal. */
  readonly title: string;
  /** Nome técnico, mostrado apenas secundariamente. */
  readonly technicalName: string;
  /** Ordena as dívidas ativas segundo a prioridade da estratégia. */
  order(debts: Debt[]): Debt[];
}

/**
 * Avalanche: prioriza as dívidas com maiores juros conhecidos ("mais
 * caras primeiro"). Dívidas sem taxa de juros conhecida são tratadas
 * explicitamente e colocadas por último, pois o Prumo nunca inventa uma
 * taxa para poder compará-las.
 */
export class AvalancheStrategy implements DebtStrategy {
  readonly type = DebtPayoffStrategyType.AVALANCHE;
  readonly title = 'Pagar primeiro as dívidas mais caras';
  readonly technicalName = 'estratégia avalanche';

  order(debts: Debt[]): Debt[] {
    return [...debts].sort((a, b) => {
      const rateA = a.interestRateMonthly;
      const rateB = b.interestRateMonthly;

      if (rateA === undefined && rateB === undefined) {
        return b.currentBalance - a.currentBalance;
      }
      if (rateA === undefined) {
        return 1;
      }
      if (rateB === undefined) {
        return -1;
      }
      return rateB - rateA;
    });
  }
}

/**
 * Snowball: prioriza as menores dívidas (por saldo atual), independente
 * da taxa de juros.
 */
export class SnowballStrategy implements DebtStrategy {
  readonly type = DebtPayoffStrategyType.SNOWBALL;
  readonly title = 'Eliminar primeiro as menores dívidas';
  readonly technicalName = 'estratégia snowball';

  order(debts: Debt[]): Debt[] {
    return [...debts].sort((a, b) => a.currentBalance - b.currentBalance);
  }
}
