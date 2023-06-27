import { currencyToSymbol, toCurrency } from '@/helpers/currency';

describe('toCurrency', () => {
  it.each([
    'USD',
    'EUR',
    'GBP',
    'HKD',
    'SGD',
    'CAD',
  ])('works with known currencies', (currency) => {
    expect(toCurrency(currency)).toEqual(currency);
  });

  it('fails when unsupported currency', () => {
    expect(() => toCurrency('NOT')).toThrow('Unsupported currency \'NOT\'');
  });
});

describe('currencyToSymbol', () => {
  it.each([
    ['USD', '$'],
    ['EUR', '€'],
    ['GBP', '£'],
    ['HKD', 'HK$'],
    ['SGD', 'S$'],
    ['CAD', 'C$'],
  ])('converts known currencies', (currency, expected) => {
    expect(currencyToSymbol(currency)).toEqual(expected);
  });

  it('returns as is when not listed', () => {
    expect(currencyToSymbol('NOT')).toEqual('NOT');
  });
});
