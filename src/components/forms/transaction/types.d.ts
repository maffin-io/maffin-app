import type { Commodity, Split } from '@/book/entities';

export type FormValues = {
  guid?: string,
  date: string,
  description: string,
  splits: Split[],
  fk_currency: Commodity,
  exchangeRate?: { [key: string]: number },
};
