import type { Account, Commodity, Split } from '@/book/entities';

export type FormValues = {
  guid?: string,
  date: string,
  description: string,
  splits: Split[],
  fk_currency: Commodity,
  exchangeRates?: { [key: string]: number },
};
