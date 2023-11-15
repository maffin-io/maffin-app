import { DateTime } from 'luxon';

import { Split } from '@/book/entities';
import Money from '@/book/Money';
import { isInvestment } from '@/book/helpers/accountType';
import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';
import type { PriceDBMap } from '@/book/prices';

export type MonthlyTotals = {
  [guid: string]: {
    [yearMonth: string]: Money,
  },
};

/**
 * For each account, it aggregates the splits monthly. Not only the ones belonging to the
 * account but also the ones from the children. The monthly aggregations are converted to
 * the currency of the account
 */
export default async function getMonthlyTotals(
  accounts: AccountsMap,
  todayQuotes: PriceDBMap,
): Promise<MonthlyTotals> {
  const rows: { date: string, total: number, accountId: string }[] = await Split
    .query(`
      SELECT
        strftime('%m/%Y', tx.post_date) AS date,
        SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) as total,
        splits.account_guid as accountId
      FROM splits
      JOIN transactions as tx ON splits.tx_guid = tx.guid
      JOIN accounts as account ON splits.account_guid = account.guid
      GROUP BY 
        accountId, date
      HAVING SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) != 0
    `);

  const monthlyTotals: MonthlyTotals = {};
  rows.forEach(row => {
    if (!(row.accountId in monthlyTotals)) {
      monthlyTotals[row.accountId] = {};
    }

    monthlyTotals[row.accountId][row.date] = new Money(
      row.total,
      accounts[row.accountId].commodity.mnemonic,
    );
  });

  accounts.type_root?.childrenIds.forEach(
    (childId: string) => {
      aggregateChildrenTotals(
        accounts[childId],
        accounts,
        todayQuotes,
        monthlyTotals,
      );

      monthlyTotals[accounts[childId].type.toLowerCase()] = monthlyTotals[childId];
    },
  );

  return monthlyTotals;
}

function aggregateChildrenTotals(
  current: Account,
  accounts: AccountsMap,
  todayQuotes: PriceDBMap,
  monthlyTotals: MonthlyTotals,
) {
  const { commodity } = current;
  current.childrenIds.forEach(childId => {
    aggregateChildrenTotals(accounts[childId], accounts, todayQuotes, monthlyTotals);

    Object.entries(monthlyTotals[childId] || {}).forEach(([key, childMonthlyTotal]) => {
      let rate = 1;
      const childAccount = accounts[childId];
      let childCurrency = childAccount.commodity.mnemonic;
      if (isInvestment(childAccount)) {
        const price = todayQuotes.getStockPrice(
          childAccount.commodity.mnemonic,
          DateTime.now(),
        );
        rate = price.value;
        childCurrency = price.currency.mnemonic;
      }
      if (childMonthlyTotal.currency !== commodity.mnemonic) {
        rate *= todayQuotes.getPrice(
          childCurrency,
          commodity.mnemonic,
          DateTime.now(),
        ).value;
      }
      if (!(current.guid in monthlyTotals)) {
        monthlyTotals[current.guid] = {};
      }
      monthlyTotals[current.guid][key] = (
        (
          monthlyTotals[current.guid][key] || new Money(0, commodity.mnemonic)
        ).add(childMonthlyTotal.convert(commodity.mnemonic, rate))
      );
    });
  });
}
