import type { Price } from '@/book/entities';

export type FormValues = Omit<Price, 'date'> & {
  date: string;
};
