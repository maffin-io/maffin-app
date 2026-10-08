import { Between } from 'typeorm';
import { DateTime } from 'luxon';

import { getTransactionsReport } from '@/lib/queries';
import { isOrphanSplit } from '@/lib/queries/getTransactionsReport';
import { Transaction } from '@/book/entities';
import type { Split } from '@/book/entities';

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

  it('excludes income/expense accounts with report disabled', async () => {
    const reportableTx = {
      guid: 'tx1',
      splits: [
        { account: { type: 'EXPENSE', report: true } },
        { account: { type: 'ASSET' } },
      ],
    } as Transaction;
    const nonReportTx = {
      guid: 'tx2',
      splits: [
        { account: { type: 'EXPENSE', report: false } },
        { account: { type: 'ASSET' } },
      ],
    } as Transaction;
    const hiddenButReportableTx = {
      guid: 'tx3',
      splits: [
        { account: { type: 'INCOME', report: true, hidden: true } },
        { account: { type: 'ASSET' } },
      ],
    } as Transaction;

    jest.spyOn(Transaction, 'find').mockResolvedValue([
      reportableTx,
      nonReportTx,
      hiddenButReportableTx,
    ]);

    const txs = await getTransactionsReport(TEST_INTERVAL);

    expect(txs).toEqual([reportableTx, hiddenButReportableTx]);
  });

  it('includes transactions with splits whose account no longer exists', async () => {
    const orphanTx = {
      guid: 'tx1',
      splits: [
        { account: null },
        { account: { type: 'EQUITY' } },
      ],
    } as unknown as Transaction;
    const transferTx = {
      guid: 'tx2',
      splits: [
        { account: { type: 'ASSET' } },
        { account: { type: 'EQUITY' } },
      ],
    } as unknown as Transaction;

    jest.spyOn(Transaction, 'find').mockResolvedValue([orphanTx, transferTx]);

    const txs = await getTransactionsReport(TEST_INTERVAL);

    expect(txs).toEqual([orphanTx]);
  });
});

describe('isOrphanSplit', () => {
  it('returns true only when the split has no account', () => {
    expect(isOrphanSplit({ account: null } as unknown as Split)).toBe(true);
    expect(isOrphanSplit({ account: { type: 'EXPENSE' } } as Split)).toBe(false);
  });
});
