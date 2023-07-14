import type { Commodity, Split } from '@/book/entities';

export type FormValues = {
  date: string,
  description: string,
  splits: Split[],
  fk_currency: Commodity,
};
