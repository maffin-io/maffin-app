import { DateTime } from 'luxon';

import Money, { convert } from '@/book/Money';
import { Account } from '@/book/entities';
import type { AccountsTotals, AccountsMap } from '@/types/book';
import type { PriceDBMap } from '@/book/prices';
import mapAccounts from './mapAccounts';
import { totalsChildIds } from './visibleAccountGuids';

export type ChildIdsFn = (accounts: AccountsMap, parent: Account) => string[];

export type AggregateChildrenOptions = {
  /**
   * Which children to roll into the parent total.
   * Defaults to totalsChildIds (IE always included; assets/liabilities
   * respect the report flag).
   */
  getChildIds?: ChildIdsFn,
  /**
   * When true, children excluded from the rollup still get their own totals
   * computed (so account detail pages still work).
   */
  keepExcludedTotals?: boolean,
};

/**
 * For some account types like Asset and Liabilities, we want to accumulate monthly
 * net worth.
 *
 * If you ask what's my current net worth, this depends on today's exchange rates.
 * Same for questions in the past, you want to check according to the exchange rates
 * at that time.
 */
export function aggregateMonthlyWorth(
  guids: string[],
  accounts: Account[],
  monthlyTotals: AccountsTotals[],
): AccountsTotals[] {
  const aggregatedTotals = Array.from({ length: monthlyTotals.length }, () => ({}));
  const accountsMap = mapAccounts(accounts);

  guids.forEach((guid: string) => {
    if (guid in accountsMap) {
      aggregateWorth(guid, accountsMap, monthlyTotals, aggregatedTotals);
    }
  });

  return aggregatedTotals;
}

function aggregateWorth(
  guid: string,
  accounts: AccountsMap,
  monthlyTotals: AccountsTotals[],
  aggregatedTotals: AccountsTotals[],
) {
  const current: Account = accounts[guid];

  monthlyTotals.forEach((_, i) => {
    const zero = new Money(0, current.commodity?.mnemonic);
    const previousMonth = aggregatedTotals[i - 1]?.[guid] || zero;
    const currentMonth = monthlyTotals[i]?.[guid] || zero;
    aggregatedTotals[i][guid] = currentMonth.add(previousMonth);
  });

  current.childrenIds.forEach((childId: string) => {
    aggregateWorth(childId, accounts, monthlyTotals, aggregatedTotals);
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
  guids: string[],
  accounts: Account[],
  prices: PriceDBMap,
  selectedDate: DateTime,
  totals: AccountsTotals,
  options: AggregateChildrenOptions = {},
): AccountsTotals {
  const {
    getChildIds = totalsChildIds,
    keepExcludedTotals = true,
  } = options;
  const accountsMap = mapAccounts(accounts);
  const aggregatedTotals: AccountsTotals = {};
  guids.forEach((guid: string) => {
    if (guid in accountsMap) {
      aggregateTotals(
        guid,
        accountsMap,
        prices,
        selectedDate,
        totals,
        aggregatedTotals,
        getChildIds,
        keepExcludedTotals,
      );
    }
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
  getChildIds: ChildIdsFn,
  keepExcludedTotals: boolean,
): Money {
  const current = accounts[guid];
  aggregatedTotals[current.guid] = totals[current.guid] || new Money(0, current.commodity.mnemonic);

  const includedChildIds = getChildIds(accounts, current);
  includedChildIds.forEach((childId: string) => {
    aggregatedTotals[current.guid] = aggregatedTotals[current.guid].add(
      convert(
        aggregateTotals(
          childId,
          accounts,
          prices,
          selectedDate,
          totals,
          aggregatedTotals,
          getChildIds,
          keepExcludedTotals,
        ),
        accounts[childId].commodity,
        current.commodity,
        prices,
        selectedDate,
      ),
    );
  });

  if (keepExcludedTotals) {
    const included = new Set(includedChildIds);
    current.childrenIds.forEach((childId: string) => {
      if (!included.has(childId)) {
        aggregateTotals(
          childId,
          accounts,
          prices,
          selectedDate,
          totals,
          aggregatedTotals,
          getChildIds,
          keepExcludedTotals,
        );
      }
    });
  }

  // This is kind of a hack to be able to access root asset/liability
  // accounts for global networth, etc. We should find a better way.
  if (accounts[current.parentId].type === 'ROOT') {
    aggregatedTotals[`type_${accounts[current.guid].type.toLowerCase()}`] = aggregatedTotals[current.guid];
  }

  return aggregatedTotals[current.guid];
}
