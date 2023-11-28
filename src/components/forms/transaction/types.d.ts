import type { Commodity, Split, Transaction } from '@/book/entities';

export type FormValues = Omit<Transaction, 'date' | 'fk_currency'> & {
  date: string,
  fk_currency: Commodity,
};
