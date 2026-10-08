import { DateTime } from 'luxon';

import getTransactionReportSections from '@/lib/reports/transactionReport';
import type { Account, Transaction } from '@/book/entities';

describe('getTransactionReportSections', () => {
  const eur = { mnemonic: 'EUR' };
  const expenseAccount = {
    guid: 'expense',
    name: 'Internet',
    path: 'Expenses:Utilities:Internet',
    type: 'EXPENSE',
    commodity: eur,
  } as Account;
  const incomeAccount = {
    guid: 'income',
    name: 'Salary',
    type: 'INCOME',
    commodity: eur,
  } as Account;
  const nonReportAccount = {
    guid: 'nonreport',
    name: 'Gifts',
    path: 'Expenses:Gifts',
    type: 'EXPENSE',
    report: false,
    commodity: eur,
  } as Account;

  it('splits rows into expenses, income and orphans', () => {
    const date = DateTime.fromISO('2025-01-07');
    const transactions = [
      {
        guid: 'tx1',
        date,
        description: 'Internet bill',
        currency: eur,
        splits: [
          { guid: 's1', quantity: 50, account: expenseAccount },
          { guid: 's2', quantity: -50, account: { type: 'ASSET' } },
        ],
      },
      {
        guid: 'tx2',
        date,
        description: 'Salary',
        currency: eur,
        splits: [
          { guid: 's3', quantity: -1000, account: incomeAccount },
          { guid: 's4', quantity: 10, account: nonReportAccount },
        ],
      },
      {
        guid: 'tx3',
        date,
        description: 'Phone',
        currency: eur,
        splits: [
          { guid: 's5', value: 1550, account: null },
          { guid: 's6', value: -1550, account: { type: 'EQUITY' } },
        ],
      },
    ] as unknown as Transaction[];

    const { expenses, income, orphans } = getTransactionReportSections(
      transactions,
      [
        { guid: 'root', name: 'Root', type: 'ROOT' } as Account,
        expenseAccount,
        incomeAccount,
        nonReportAccount,
      ],
    );

    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toEqual(expect.objectContaining({
      guid: 'tx1-s1',
      date,
      description: 'Internet bill',
      accountName: 'Utilities:Internet',
    }));
    expect(expenses[0].amount.toString()).toEqual('50 EUR');

    expect(income).toHaveLength(1);
    expect(income[0].accountName).toEqual('Salary');
    expect(income[0].amount.toString()).toEqual('1000 EUR');

    expect(orphans).toHaveLength(1);
    expect(orphans[0]).toEqual(expect.objectContaining({
      guid: 'tx3-s5',
      accountName: 'Orphan',
    }));
    expect(orphans[0].amount.toString()).toEqual('1550 EUR');
  });
});
