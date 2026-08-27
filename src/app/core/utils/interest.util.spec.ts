import { estimateInstallmentAmount, estimateMonthlyInterestPerThousand } from './interest.util';

describe('interest.util', () => {
  it('calcula o valor aproximado da parcela', () => {
    expect(estimateInstallmentAmount(1200, 6)).toBe(200);
  });

  it('retorna o valor total quando não há parcelamento', () => {
    expect(estimateInstallmentAmount(500, 0)).toBe(500);
  });

  it('estima os juros aproximados por R$ 1.000', () => {
    expect(estimateMonthlyInterestPerThousand(8)).toBe(80);
  });
});
