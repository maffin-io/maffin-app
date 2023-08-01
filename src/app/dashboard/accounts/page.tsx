'use client';

import React from 'react';
import useSWRImmutable from 'swr/immutable';
import { DateTime, Interval } from 'luxon';

import type { Account } from '@/book/entities';
import Money from '@/book/Money';
import AccountsTable from '@/components/AccountsTable';
import AddAccountButton from '@/components/buttons/AddAccountButton';
import { getAccountsWithPath, getEarliestDate } from '@/book/queries';
import { PriceDB, PriceDBMap } from '@/book/prices';
import DateRangeInput from '@/components/DateRangeInput';
import type { AccountsTree } from '@/types/accounts';

export default function AccountsPage(): JSX.Element {
  const { data: earliestDate } = useSWRImmutable(
    '/api/start-date',
    () => getEarliestDate(),
  );

  React.useEffect(() => {
    if (earliestDate) {
      setDateRange(Interval.fromDateTimes(
        earliestDate,
        DateTime.now(),
      ));
    }
  }, [earliestDate]);

  const [dateRange, setDateRange] = React.useState(
    Interval.fromDateTimes(
      earliestDate || DateTime.now().startOf('year'),
      DateTime.now(),
    ),
  );

  let { data: accounts } = useSWRImmutable(
    '/api/accounts/splits',
    () => getAccountsWithPath({
      relations: { splits: { fk_transaction: true } },
      showRoot: true,
    }),
  );

  let { data: todayPrices } = useSWRImmutable(
    '/api/prices/today',
    PriceDB.getTodayQuotes,
  );

  accounts = accounts || [];
  todayPrices = todayPrices || new PriceDBMap();

  let tree: AccountsTree = {
    account: {},
    total: new Money(0, 'EUR'),
    children: [],
  };
  const root = accounts.find(a => a.type === 'ROOT');
  if (root && !todayPrices.isEmpty) {
    tree = buildNestedRows(root, accounts, todayPrices, dateRange);
  }

  return (
    <>
      <div className="flex items-center pb-4">
        <span className="text-xl font-medium">
          Your finances
        </span>
        <span className="ml-auto mr-3">
          <DateRangeInput
            earliestDate={earliestDate}
            dateRange={dateRange}
            onChange={setDateRange}
          />
        </span>
        <div>
          <AddAccountButton />
        </div>
      </div>
      <div className="grid grid-cols-12 items-top pb-4">
        <div className="col-span-3 p-4 mr-4 rounded-sm bg-gunmetal-700">
          <AccountsTable tree={tree} />
        </div>
      </div>
    </>
  );
}

/**
 * This function recursively goes through all the accounts so it can build the tree
 * of accounts containing total and subrows so they can be rendered in react table.
 *
 * Note that it interacts with PriceDB so prices can be aggregated to the parent's
 * total in order to display total amounts of assets, income, etc.
 */
function buildNestedRows(
  current: Account,
  accounts: Account[],
  todayQuotes: PriceDBMap,
  dateRange: Interval,
): AccountsTree {
  const { childrenIds } = current;
  let total = current.getTotal(dateRange);
  let subRows: AccountsTree[] = [];

  if (current.type === 'ROOT') {
    subRows = childrenIds.map(childId => {
      const child = accounts.find(a => a.guid === childId) as Account;
      const childTree = buildNestedRows(child, accounts, todayQuotes, dateRange);
      return childTree;
    });
  } else {
    const commodity = current.commodity.mnemonic;
    if (['STOCK', 'MUTUAL'].includes(current.type)) {
      const price = todayQuotes.getStockPrice(
        current.commodity.mnemonic,
        DateTime.now(),
      );
      total = total.convert(price.currency.mnemonic, price.value);
    }
    subRows = childrenIds.map(childId => {
      const child = accounts.find(a => a.guid === childId) as Account;
      const childTree = buildNestedRows(child, accounts, todayQuotes, dateRange);
      let childTotal = childTree.total;
      if (childTotal.currency !== commodity) {
        const price = todayQuotes.getPrice(
          childTotal.currency,
          commodity,
          DateTime.now(),
        );
        childTotal = childTotal.convert(commodity, price.value);
      }
      total = total.add(childTotal);
      return childTree;
    });
  }

  return {
    account: current,
    total,
    children: subRows,
  };
}
