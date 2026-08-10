import { Between } from 'typeorm';
import { DateTime } from 'luxon';

import { getTransactionsReport } from '@/lib/queries';
import { Transaction } from '@/book/entities';

describe('getTransactionsReport', () => {
  it('calls find as expected and filters income/expense txs', async () => {
    const incomeTx = {
      guid: 'tx1',
      splits: [
        { account: { type: 'INCOME' } },
        { account: { type: 'ASSET' } },
      ],
    } as Transaction;
    const transferTx = {
      guid: 'tx2',
      splits: [
        { account: { type: 'ASSET' } },
        { account: { type: 'ASSET' } },
      ],
    } as Transaction;
    const expenseTx = {
      guid: 'tx3',
      splits: [
        { account: { type: 'EXPENSE' } },
        { account: { type: 'ASSET' } },
      ],
    } as Transaction;

    jest.spyOn(Transaction, 'find').mockResolvedValue([incomeTx, transferTx, expenseTx]);

    const interval = TEST_INTERVAL;
    const txs = await getTransactionsReport(interval);

    expect(Transaction.find).toBeCalledWith({
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
    expect(txs).toEqual([incomeTx, expenseTx]);
  });
});
