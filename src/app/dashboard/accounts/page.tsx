'use client';

import React from 'react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import type { Account } from '@/book/entities';
import Money from '@/book/Money';
import AddAccountButton from '@/components/buttons/AddAccountButton';
import {
  AccountsTable,
  NetWorthPie,
  NetWorthHistogram,
  MonthlyTotalHistogram,
  LatestTransactions,
} from '@/components/pages/accounts';
import { PriceDBMap } from '@/book/prices';
import DateRangeInput from '@/components/DateRangeInput';
import { useApi } from '@/hooks';
import type { AccountsTree, AccountsMap } from '@/types/book';
import type { MonthlyTotals } from '@/lib/queries';

export default function AccountsPage(): JSX.Element {
  const { data: earliestDate } = useApi('/api/start-date');
  let { data: accounts } = useApi('/api/accounts') as SWRResponse<AccountsMap>;
  let { data: monthlyTotals } = useApi('/api/accounts/monthly-totals') as SWRResponse<MonthlyTotals>;
  let { data: todayPrices } = useApi('/api/prices/today');

  const [selectedDate, setSelectedDate] = React.useState(DateTime.now());

  accounts = accounts || {};
  monthlyTotals = monthlyTotals || {};
  todayPrices = todayPrices || new PriceDBMap();

  let tree: AccountsTree = {
    account: {},
    total: new Money(0, 'EUR'),
    monthlyTotals: {},
    children: [],
  };
  const { root } = accounts;
  if (root && !todayPrices.isEmpty) {
    const start = performance.now();
    tree = buildNestedRows(root, accounts, monthlyTotals, todayPrices, selectedDate);
    const end = performance.now();
    console.log(`build nested rows: ${end - start}ms`);
  }

  return (
    <>
      <div className="flex items-center">
        <span className="text-xl font-medium">
          Your finances
        </span>
        <span className="ml-auto mr-3">
          <DateRangeInput
            earliestDate={earliestDate}
            dateRange={{
              start: selectedDate,
              end: selectedDate,
            }}
            onChange={(value: { start: DateTime, end: DateTime }) => setSelectedDate(value.start)}
            asSingle
          />
        </span>
        <div>
          <AddAccountButton />
        </div>
      </div>
      <div className="grid grid-cols-12 items-start items-top pb-4">
        <div className="grid grid-cols-12 col-span-3">
          <div className="col-span-12 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <NetWorthPie tree={tree} />
          </div>
          <div className="col-span-12 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <AccountsTable tree={tree} />
          </div>
        </div>
        <div className="grid grid-cols-12 items-start items-top col-span-9">
          <div className="col-span-9 p-4 mb-4 mr-4 rounded-sm bg-gunmetal-700">
            <NetWorthHistogram
              tree={tree}
              startDate={earliestDate}
              selectedDate={selectedDate}
            />
          </div>
          <div className="col-span-3 p-4 mb-4 mr-4 rounded-sm bg-gunmetal-700">
            <LatestTransactions />
          </div>
          <div className="col-span-6 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <MonthlyTotalHistogram
              title="Income"
              tree={tree.children.find(a => a.account.type === 'INCOME')}
              selectedDate={selectedDate}
            />
          </div>
          <div className="col-span-6 p-4 mr-4 rounded-sm bg-gunmetal-700">
            <MonthlyTotalHistogram
              title="Expenses"
              tree={tree.children.find(a => a.account.type === 'EXPENSE')}
              selectedDate={selectedDate}
            />
          </div>
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
  accounts: AccountsMap,
  monthlyTotals: MonthlyTotals,
  todayQuotes: PriceDBMap,
  date: DateTime,
): AccountsTree {
  const { childrenIds } = current;
  let children: AccountsTree[] = [];
  const currentMonthlyTotals: { [key: string]: Money } = {};
  let commodity = current.commodity?.mnemonic;

  if (current.type === 'ROOT') {
    children = childrenIds.map(childId => {
      const child = accounts[childId];
      const childTree = buildNestedRows(child, accounts, monthlyTotals, todayQuotes, date);
      return childTree;
    });
  } else {
    Object.entries(monthlyTotals[current.guid] || {}).forEach(([key, n]) => {
      currentMonthlyTotals[key] = new Money(n, current.commodity.mnemonic);
    });
    if (['STOCK', 'MUTUAL'].includes(current.type)) {
      const price = todayQuotes.getStockPrice(
        commodity,
        DateTime.now(),
      );
      Object.entries(monthlyTotals[current.guid] || {}).forEach(([key, n]) => {
        const monthlyTotal = new Money(n, commodity);
        currentMonthlyTotals[key] = monthlyTotal.convert(
          price.currency.mnemonic,
          price.value,
        );
      });
      commodity = price.currency.mnemonic;
    }
    children = childrenIds.map(childId => {
      const child = accounts[childId];
      const childTree = buildNestedRows(child, accounts, monthlyTotals, todayQuotes, date);
      let childTotal = childTree.total;
      const childMonthlyTotals = childTree.monthlyTotals;
      if (childTotal.currency !== commodity) {
        const price = todayQuotes.getPrice(
          childTotal.currency,
          commodity,
          DateTime.now(),
        );
        childTotal = childTotal.convert(commodity, price.value);
        Object.entries(childMonthlyTotals).forEach(([key, monthlyTotal]) => {
          childMonthlyTotals[key] = monthlyTotal.convert(commodity, price.value);
        });
      }
      Object.entries(childMonthlyTotals).forEach(([key, monthlyTotal]) => {
        currentMonthlyTotals[key] = monthlyTotal.add(
          currentMonthlyTotals[key] || new Money(0, commodity),
        );
      });
      return childTree;
    });
  }

  return {
    account: current,
    total: Object.values(currentMonthlyTotals).reduce(
      (total, amount) => total.add(amount),
      new Money(0, commodity),
    ),
    monthlyTotals: currentMonthlyTotals,
    children,
  };
}
