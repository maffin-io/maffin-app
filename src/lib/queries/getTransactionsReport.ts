import { Between } from 'typeorm';
import type { DateTime, Interval } from 'luxon';

import { Transaction } from '@/book/entities';

/**
 * Returns transactions in the given interval that involve
 * at least one INCOME or EXPENSE account.
 */
export default async function getTransactionsReport(
  interval: Interval,
): Promise<Transaction[]> {
  const txs = await Transaction.find({
    where: {
      date: Between(
        interval.start as DateTime,
        interval.end as DateTime,
      ),
    },
    relations: {
      splits: {
        fk_account: true,
      },
    },
    order: {
      date: 'DESC',
      enterDate: 'DESC',
    },
  });

  return txs.filter(
    tx => tx.splits.some(
      split => split.account.type === 'INCOME' || split.account.type === 'EXPENSE',
    ),
  );
}
