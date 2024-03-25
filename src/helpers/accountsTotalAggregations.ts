import { DateTime } from 'luxon';

import Money, { convert } from '@/book/Money';
import { Account } from '@/book/entities';
import type { AccountsTotals, AccountsMap } from '@/types/book';
import type { PriceDBMap } from '@/book/prices';
import mapAccounts from './mapAccounts';

/**
 * For some account types like Asset and Liabilities, we want to accumulate monthly
 * net worth.
 *
 * If you ask what's my current net worth, this depends on today's exchange rates.
 * Same for questions in the past, you want to check according to the exchange rates
 * at that time.
 */
export function aggregateMonthlyWorth(
  guid: string,
  accounts: Account[],
  monthlyTotals: AccountsTotals[],
  dates: DateTime[],
): AccountsTotals[] {
  const aggregatedTotals = Array.from({ length: dates.length }, () => ({}));
  aggregateWorth(guid, mapAccounts(accounts), monthlyTotals, dates, aggregatedTotals);
  return aggregatedTotals;
}

function aggregateWorth(
  guid: string,
  accounts: AccountsMap,
  monthlyTotals: AccountsTotals[],
  dates: DateTime[],
  aggregatedTotals: AccountsTotals[],
) {
  const current: Account = accounts[guid];
  current.childrenIds.forEach(childId => {
    aggregateWorth(childId, accounts, monthlyTotals, dates, aggregatedTotals);
  });

  dates.forEach((_, i) => {
    const zero = new Money(0, current.commodity?.mnemonic);
    const previousMonth = aggregatedTotals[i - 1]?.[current.guid] || zero;
    const currentMonth = monthlyTotals[i]?.[current.guid] || zero;
    aggregatedTotals[i][current.guid] = currentMonth.add(previousMonth);
  });
}

/**
 * Given an AccountsTotal, aggregate the totals of the children into
 * their parent.
 *
 * If the children have different commodities, convert
 * them accordingly.
 */
export function aggregateChildrenTotals(
  guid: string,
  accounts: Account[],
  prices: PriceDBMap,
  selectedDate: DateTime,
  totals: AccountsTotals,
): AccountsTotals {
  const accountsMap = mapAccounts(accounts);
  const aggregatedTotals: AccountsTotals = {};
  accountsMap[guid].childrenIds.forEach((childId: string) => {
    aggregateTotals(
      childId,
      accountsMap,
      prices,
      selectedDate,
      totals,
      aggregatedTotals,
    );

    aggregatedTotals[`type_${accountsMap[childId].type.toLowerCase()}`] = aggregatedTotals[childId];
  });

  return aggregatedTotals;
}

function aggregateTotals(
  guid: string,
  accounts: AccountsMap,
  prices: PriceDBMap,
  selectedDate: DateTime,
  totals: AccountsTotals,
  aggregatedTotals: AccountsTotals,
): Money {
  const current = accounts[guid];
  aggregatedTotals[current.guid] = totals[current.guid] || new Money(0, current.commodity.mnemonic);

  current.childrenIds.forEach((childId: string) => {
    aggregatedTotals[current.guid] = aggregatedTotals[current.guid].add(
      convert(
        aggregateTotals(childId, accounts, prices, selectedDate, totals, aggregatedTotals),
        accounts[childId].commodity,
        current.commodity,
        prices,
        selectedDate,
      ),
    );
  });

  return aggregatedTotals[current.guid];
}
