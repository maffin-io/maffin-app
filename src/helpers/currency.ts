export type Currency = keyof typeof SUPPORTED_CURRENCIES;

const SUPPORTED_CURRENCIES: { [key:string]:string; } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  HKD: 'HK$',
  SGD: 'S$',
  CAD: 'C$',
};

export function toCurrency(currency: string): Currency {
  if (!(currency in SUPPORTED_CURRENCIES)) {
    throw new Error(`Unsupported currency '${currency}'`);
  }

  return currency as Currency;
}

export function currencyToSymbol(currency: Currency): string {
  const strCurrency = String(currency);
  return SUPPORTED_CURRENCIES[strCurrency] || strCurrency;
}
