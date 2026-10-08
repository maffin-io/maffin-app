import type { Row } from 'write-excel-file/browser';

import type { IncomeStatementProps } from '@/templates/pdf/IncomeExpenseStatement';
import type { AccountsTableRow } from '@/lib/getAccountsTree';
import getIncomeStatementTrees, { nonZeroLeaves } from '@/lib/reports/incomeStatement';
import { amountCell, HEADER_STYLE } from '@/templates/excel/cells';

export default async function IncomeExpenseStatementExcel({
  interval,
  accounts,
  totals,
}: IncomeStatementProps): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const { expenses, income } = getIncomeStatementTrees({ interval, accounts, totals });

  return writeXlsxFile(
    [
      [{ value: `Income statement ${interval.toISODate()}`, fontWeight: 'bold', fontSize: 14 }],
      [],
      ['Account', 'Total', 'Currency'].map(value => ({ value, ...HEADER_STYLE })),
      ...toRows(expenses),
      [],
      ...toRows(income),
    ],
    {
      sheet: 'Income statement',
      columns: [
        { width: 40 },
        { width: 16 },
        { width: 10 },
      ],
    },
  ).toBlob();
}

function toRows(tree: AccountsTableRow, depth = 0): Row[] {
  const isRoot = depth === 0;
  return [
    [
      {
        value: tree.account.name,
        indent: depth,
        ...(isRoot && { fontWeight: 'bold' as const }),
      },
      {
        ...amountCell(tree.total),
        ...(isRoot && { fontWeight: 'bold' as const }),
      },
      tree.total.currency,
    ],
    ...nonZeroLeaves(tree).flatMap(leaf => toRows(leaf, depth + 1)),
  ];
}
