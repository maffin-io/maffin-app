import { DateTime } from 'luxon';

import Money from '@/book/Money';
import { Split } from '@/book/entities';
import type { Account } from '@/book/entities';
import mapAccounts from '@/helpers/mapAccounts';
import aggregateChildrenTotals from '@/helpers/aggregateChildrenTotals';
import type { AccountsTotals } from '@/types/book';
import type { PriceDBMap } from '@/book/prices';

export default async function getAccountsTotals(
  accounts: Account[],
  prices: PriceDBMap,
  selectedDate: DateTime,
): Promise<AccountsTotals> {
  const rows: { total: number, accountId: string, mnemonic: string }[] = await Split
    .query(`
      SELECT
        ABS(SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom)) as total,
        splits.account_guid as accountId
      FROM splits
      JOIN accounts as account ON splits.account_guid = account.guid
      JOIN transactions as tx ON splits.tx_guid = tx.guid
      WHERE post_date <= '${selectedDate.toSQLDate()}'
      GROUP BY 
        accountId
      HAVING SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) != 0
    `);

  const accountsMap = mapAccounts(accounts);
  const totals: { [guid: string]: Money } = {};

  rows.forEach(row => {
    totals[row.accountId] = new Money(row.total, accountsMap[row.accountId].commodity.mnemonic);
  });

  return aggregateChildrenTotals(
    'type_root',
    accounts as Account[],
    prices as PriceDBMap,
    selectedDate,
    totals,
  );
}
