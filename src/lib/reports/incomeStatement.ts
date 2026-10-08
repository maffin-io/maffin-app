import type { DateTime, Interval } from 'luxon';

import type { Account } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';
import getAccountsTree, { AccountsTableRow } from '@/lib/getAccountsTree';
import mapAccounts from '@/helpers/mapAccounts';
import { aggregateChildrenTotals } from '@/helpers/accountsTotalAggregations';
import { isReportAccount, reportChildIds } from '@/helpers/visibleAccountGuids';
import { PriceDBMap } from '@/book/prices';

export type IncomeStatementTrees = {
  expenses: AccountsTableRow,
  income: AccountsTableRow,
};

export default function getIncomeStatementTrees({
  interval,
  accounts,
  totals,
}: {
  interval: Interval,
  accounts: Account[],
  totals: AccountsTotals,
}): IncomeStatementTrees {
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
  return {
    expenses: getAccountsTree(accountsMap.type_expense, accountsMap, reportTotals, treeOptions),
    income: getAccountsTree(accountsMap.type_income, accountsMap, reportTotals, treeOptions),
  };
}

/**
 * Leaves with a zero total are not relevant for the statement.
 */
export function nonZeroLeaves(tree: AccountsTableRow): AccountsTableRow[] {
  return tree.leaves.filter(leaf => leaf.total.toNumber() !== 0);
}
