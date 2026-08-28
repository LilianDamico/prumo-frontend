import { formatIsoDateAsBr } from './date.util';

describe('formatIsoDateAsBr', () => {
  it('formats an ISO civil date as DD/MM/AAAA', () => {
    expect(formatIsoDateAsBr('2026-08-28')).toBe('28/08/2026');
  });

  it('does not shift the day near month/year boundaries regardless of timezone', () => {
    // Regressão: `new Date('2026-01-01')`/`DatePipe` podem exibir 31/12 em
    // timezones negativos, pois interpretam a string como UTC e formatam
    // no fuso local. `formatIsoDateAsBr` nunca deve sofrer esse desvio.
    expect(formatIsoDateAsBr('2026-01-01')).toBe('01/01/2026');
    expect(formatIsoDateAsBr('2025-12-31')).toBe('31/12/2025');
  });

  it('returns the original value when the input is not a valid ISO date', () => {
    expect(formatIsoDateAsBr('invalid')).toBe('invalid');
  });
});
