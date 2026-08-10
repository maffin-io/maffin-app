import React from 'react';
import { Interval } from 'luxon';
import type { DateTime } from 'luxon';

import type { Account } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';
import getAccountsTree, { AccountsTableRow } from '@/lib/getAccountsTree';
import mapAccounts from '@/helpers/mapAccounts';
import { aggregateChildrenTotals } from '@/helpers/accountsTotalAggregations';
import { isReportAccount, reportChildIds } from '@/helpers/visibleAccountGuids';
import { PriceDBMap } from '@/book/prices';

export type IncomeStatementProps = {
  interval: Interval;
  accounts: Account[],
  totals: AccountsTotals,
};

export default async function IncomeExpenseStatement({
  interval,
  accounts,
  totals,
}: IncomeStatementProps) {
  // This is horrible but couldn't manage to import react-pdf properly as it is giving
  // errors even when using nextjs dynamic
  const {
    Page,
    Text,
    View,
    Document,
  } = await import('@react-pdf/renderer');

  const reportTotals = aggregateChildrenTotals(
    ['type_income', 'type_expense'],
    accounts,
    new PriceDBMap(),
    interval.end as DateTime,
    totals,
    {
      getChildIds: reportChildIds,
      keepExcludedTotals: false,
    },
  );

  const accountsMap = mapAccounts(accounts);
  const treeOptions = { shouldInclude: isReportAccount };
  const expensesTree = getAccountsTree(
    accountsMap.type_expense,
    accountsMap,
    reportTotals,
    treeOptions,
  );
  const ExpensesTable = buildTable(expensesTree, View, Text);

  const incomeTree = getAccountsTree(
    accountsMap.type_income,
    accountsMap,
    reportTotals,
    treeOptions,
  );
  const IncomeTable = buildTable(incomeTree, View, Text);

  return (
    <Document>
      <Page size="A4">
        <View
          style={{
            padding: 20,
            marginTop: 10,
            fontSize: 16,
          }}
        >
          <Text>
            Income statement
            {' '}
            {interval.toISODate()}
          </Text>
        </View>
        <View
          style={{
            fontSize: 12,
            padding: 20,
          }}
        >
          {ExpensesTable}
        </View>
        <View
          style={{
            fontSize: 12,
            padding: 20,
          }}
        >
          {IncomeTable}
        </View>
      </Page>
    </Document>
  );
}

function buildTable(
  tree: AccountsTableRow,
  View: any,
  Text: any,
  padding = 10,
) {
  const currentAccount = (
    <View
      key={tree.account.guid}
      style={{
        paddingLeft: padding,
      }}
    >
      <Text>
        {tree.account.name}
        {' '}
        -
        {' '}
        {tree.total.format()}
      </Text>
    </View>
  );

  const leaves = tree.leaves.filter(leaf => leaf.total.toNumber() !== 0);
  const childViews = leaves.map(leaf => buildTable(leaf, View, Text, padding + 10));

  return (
    <View
      key={tree.account.guid}
      style={{ marginTop: 4 }}
    >
      {currentAccount}
      {childViews}
    </View>
  );
}
