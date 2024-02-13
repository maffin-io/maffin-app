import { DateTime, Interval } from 'luxon';

import { Split } from '@/book/entities';
import Money from '@/book/Money';
import { isAsset, isInvestment, isLiability } from '@/book/helpers/accountType';
import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';
import type { PriceDBMap } from '@/book/prices';
import mapAccounts from '@/helpers/mapAccounts';
import getEarliestDate from './getEarliestDate';

export type MonthlyTotals = {
  [guid: string]: {
    [yearMonth: string]: Money,
  },
};

/**
 * For each account, it aggregates quantities monthly. Not only the ones belonging to the
 * account but also the ones from the children. The monthly aggregations are converted to
 * the currency of the account/
 *
 * It behaves a bit differently depending on the account type:
 *
 * - For Asset and Liability accounts, each month is an aggregate of the TOTAL value. This is
 *   because usually you want to represent TOTAL value for a specific date rather than the
 *   transactions you've done. This allows for calculating the TOTAL for that specific date
 *   taking into account the exchange rates for that specific month.
 *
 * - For Income and Expense, we aggregate monthly splits because when calculating TOTAL
 *   expense for a month, you want the one for that month specifically. Even when you calculate
 *   TOTAL expense for a month, the quantities are fixed because an EXPENSE/INCOME is something
 *   that already happened.
 */
export default async function getMonthlyTotals(
  accounts: Account[],
  prices: PriceDBMap,
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
      ORDER BY date
    `);

  const accountsMap = mapAccounts(accounts);

  const monthlyTotals: MonthlyTotals = {};
  rows.forEach(row => {
    if (!(row.accountId in monthlyTotals)) {
      monthlyTotals[row.accountId] = {};
    }

    monthlyTotals[row.accountId][row.date] = new Money(
      row.total,
      accountsMap[row.accountId].commodity.mnemonic,
    );
  });

  const startDate = await getEarliestDate();
  const interval = Interval.fromDateTimes(startDate, DateTime.now());
  const dates = interval.splitBy({ month: 1 }).map(d => (d.start as DateTime).endOf('month'));

  accountsMap.type_root?.childrenIds.forEach(
    (childId: string) => {
      const account = accountsMap[childId];
      if (isAsset(account) || isLiability(account)) {
        aggregateMonthlyWorth(
          account,
          accountsMap,
          prices,
          monthlyTotals,
          dates,
        );
      }

      aggregateChildrenTotals(
        account,
        accountsMap,
        prices,
        monthlyTotals,
      );

      monthlyTotals[accountsMap[childId].type.toLowerCase()] = monthlyTotals[childId];
    },
  );

  return monthlyTotals;
}

/**
 * Asset and Liability accounts are something that accumulate value over time.
 *
 * If you ask what's my current net worth, this depends on today's exchange rates.
 * Same for questions in the past, you want to check according to the exchange rates
 * at that time.
 */
function aggregateMonthlyWorth(
  current: Account,
  accounts: AccountsMap,
  prices: PriceDBMap,
  monthlyTotals: MonthlyTotals,
  dates: DateTime[],
) {
  current.childrenIds.forEach(childId => {
    aggregateMonthlyWorth(accounts[childId], accounts, prices, monthlyTotals, dates);
  });

  dates.forEach(d => {
    if (!(current.guid in monthlyTotals)) {
      monthlyTotals[current.guid] = {};
    }
    const totals = monthlyTotals[current.guid];

    const previousMonthTotal = totals[d.minus({ month: 1 }).toFormat('MM/yyyy')]
      || new Money(0, current.commodity.mnemonic);
    const currentMonthTotal = totals[d.toFormat('MM/yyyy')]
      || new Money(0, current.commodity.mnemonic);
    totals[d.toFormat('MM/yyyy')] = currentMonthTotal.add(previousMonthTotal);
  });
}

/**
 * Expense and Income accounts are something that happen when a given transaction is entered
 * If you want to count how much you spent, you use the rate at that specific moment.
 *
 * If you ask how much I spent in the last year, you don't want this amount to change depending
 * on the current exchange rates.
 */
function aggregateChildrenTotals(
  current: Account,
  accounts: AccountsMap,
  prices: PriceDBMap,
  monthlyTotals: MonthlyTotals,
) {
  const { commodity } = current;
  current.childrenIds.forEach(childId => {
    aggregateChildrenTotals(accounts[childId], accounts, prices, monthlyTotals);

    Object.entries(monthlyTotals[childId] || {}).forEach(([key, childMonthlyTotal]) => {
      let rate = 1;
      const childAccount = accounts[childId];
      let childCurrency = childAccount.commodity.mnemonic;
      // We are aggregating a monthly total so we try to find the latest exchange rate
      let date = DateTime.fromFormat(key, 'MM/yyyy').endOf('month');
      if (date > DateTime.now()) {
        date = DateTime.now();
      }
      if (isInvestment(childAccount)) {
        const stockPrice = prices.getInvestmentPrice(
          childAccount.commodity.mnemonic,
          date,
        );
        rate = stockPrice.value;
        childCurrency = stockPrice.currency.mnemonic;
      }
      if (childMonthlyTotal.currency !== commodity.mnemonic) {
        rate *= prices.getPrice(
          childCurrency,
          commodity.mnemonic,
          date,
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
