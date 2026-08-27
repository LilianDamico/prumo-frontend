/**
 * Utilitários de aproximação para parcelamento e juros. Todos os valores
 * são explicitamente aproximados — o Prumo nunca apresenta esses números
 * como cálculos exatos de CET ou de encargos contratuais.
 */

/** Valor aproximado de cada parcela de uma compra ou dívida parcelada. */
export function estimateInstallmentAmount(totalAmount: number, installmentsCount: number): number {
  if (installmentsCount <= 0) {
    return totalAmount;
  }
  return totalAmount / installmentsCount;
}

/**
 * Divide um valor total em parcelas com centavos consistentes (cada parcela
 * arredondada em centavos, com a diferença de arredondamento concentrada na
 * última parcela para que a soma das parcelas seja sempre igual ao total).
 * Não presume juros: apenas distribui o valor original.
 */
export function distributeInstallmentAmounts(totalAmount: number, installmentsCount: number): number[] {
  if (installmentsCount <= 1) {
    return [roundToCents(totalAmount)];
  }

  const baseInstallment = roundToCents(totalAmount / installmentsCount);
  const installments = new Array<number>(installmentsCount).fill(baseInstallment);

  const roundingDifference = roundToCents(totalAmount - baseInstallment * installmentsCount);
  installments[installmentsCount - 1] = roundToCents(baseInstallment + roundingDifference);

  return installments;
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Aproximação simples de quanto R$ 1.000 ainda devidos renderiam de juros
 * em um mês, dada uma taxa mensal em percentual (ex.: 8 para 8% ao mês).
 * Não considera capitalização, multas ou outras cobranças.
 */
export function estimateMonthlyInterestPerThousand(monthlyRatePercent: number): number {
  return (monthlyRatePercent / 100) * 1000;
}
