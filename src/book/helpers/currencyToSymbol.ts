const CURRENCY_SYMBOLS: { [key:string]:string; } = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  HKD: 'HK$',
  SGD: 'S$',
  CAD: 'C$',
};

export function currencyToSymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}
