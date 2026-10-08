import type { Row } from 'write-excel-file/browser';

import type { TransactionReportProps } from '@/templates/pdf/TransactionReport';
import getTransactionReportSections from '@/lib/reports/transactionReport';
import type { TransactionReportRow } from '@/lib/reports/transactionReport';
import { amountCell, dateCell, HEADER_STYLE } from '@/templates/excel/cells';

export default async function TransactionReportExcel({
  transactions,
  accounts,
}: TransactionReportProps): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const { expenses, income, orphans } = getTransactionReportSections(transactions, accounts);

  return writeXlsxFile(
    [
      ...toSection('Expenses', expenses),
      [],
      ...toSection('Income', income),
      ...(orphans.length > 0 ? [[], ...toSection('Orphan', orphans)] : []),
    ],
    {
      sheet: 'Transactions',
      columns: [
        { width: 12 },
        { width: 40 },
        { width: 30 },
        { width: 14 },
        { width: 10 },
      ],
    },
  ).toBlob();
}

function toSection(title: string, rows: TransactionReportRow[]): Row[] {
  const header: Row = ['Date', 'Description', 'Account', 'Amount', 'Currency'].map(
    value => ({ value, ...HEADER_STYLE }),
  );

  return [
    [{ value: title, fontWeight: 'bold', fontSize: 14 }],
    header,
    ...(rows.length > 0
      ? rows.map(row => [
        dateCell(row.date),
        row.description,
        row.accountName,
        amountCell(row.amount),
        row.amount.currency,
      ])
      : [['No transactions']]),
  ];
}
