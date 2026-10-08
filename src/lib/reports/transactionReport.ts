import type { DateTime } from 'luxon';

import Money from '@/book/Money';
import type { Account, Transaction } from '@/book/entities';
import mapAccounts from '@/helpers/mapAccounts';
import { isOrphanSplit } from '@/lib/queries/getTransactionsReport';

export type TransactionReportRow = {
  guid: string,
  date: DateTime,
  description: string,
  accountName: string,
  amount: Money,
};

export type TransactionReportSections = {
  expenses: TransactionReportRow[],
  income: TransactionReportRow[],
  orphans: TransactionReportRow[],
};

export default function getTransactionReportSections(
  transactions: Transaction[],
  accounts: Account[],
): TransactionReportSections {
  const accountsMap = mapAccounts(accounts);
  return {
    expenses: buildRows(transactions, 'EXPENSE', accountsMap),
    income: buildRows(transactions, 'INCOME', accountsMap),
    orphans: buildOrphanRows(transactions),
  };
}

function buildRows(
  transactions: Transaction[],
  type: 'INCOME' | 'EXPENSE',
  accountsMap: ReturnType<typeof mapAccounts>,
): TransactionReportRow[] {
  const rows: TransactionReportRow[] = [];

  transactions.forEach(tx => {
    tx.splits
      .filter(split => split.account?.type === type && split.account.report !== false)
      .forEach(split => {
        const account = accountsMap[split.account.guid] || split.account;
        const quantity = type === 'INCOME' ? Math.abs(split.quantity) : split.quantity;
        rows.push({
          guid: `${tx.guid}-${split.guid}`,
          date: tx.date,
          description: tx.description,
          accountName: formatAccountPath(account.path || account.name),
          amount: new Money(quantity, split.account.commodity.mnemonic),
        });
      });
  });

  return rows;
}

function buildOrphanRows(transactions: Transaction[]): TransactionReportRow[] {
  const rows: TransactionReportRow[] = [];

  transactions.forEach(tx => {
    tx.splits.filter(isOrphanSplit).forEach(split => {
      rows.push({
        guid: `${tx.guid}-${split.guid}`,
        date: tx.date,
        description: tx.description,
        accountName: 'Orphan',
        amount: new Money(split.value, tx.currency.mnemonic),
      });
    });
  });

  return rows;
}

/**
 * Drops the top-level type root from the path so
 * "Expenses:Utilities:Internet" becomes "Utilities:Internet".
 */
function formatAccountPath(path: string): string {
  const colonIndex = path.indexOf(':');
  return colonIndex >= 0 ? path.slice(colonIndex + 1) : path;
}
