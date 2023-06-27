import type { Account } from '@/book/entities';

export type FormValues = {
  date: string,
  description: string,
  fromAccount: Account,
  splits: SplitFieldData[],
  totalAmount: number,
};

export type SplitFieldData = {
  amount: number,
  toAccount: Account,
  exchangeRate?: number,
};
