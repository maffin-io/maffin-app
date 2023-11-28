import type { Account } from '@/book/entities';

export type FormValues = Account & {
  balance?: number,
  balanceDate?: string,
};
