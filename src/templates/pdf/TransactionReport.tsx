import React from 'react';
import { Interval } from 'luxon';

import Money from '@/book/Money';
import type { Split, Transaction } from '@/book/entities';

export type TransactionReportProps = {
  interval: Interval;
  transactions: Transaction[],
};

type ReportRow = {
  guid: string,
  date: string,
  description: string,
  accountName: string,
  amount: string,
};

export default async function TransactionReport({
  interval,
  transactions,
}: TransactionReportProps) {
  // This is horrible but couldn't manage to import react-pdf properly as it is giving
  // errors even when using nextjs dynamic
  const {
    Page,
    Text,
    View,
    Document,
  } = await import('@react-pdf/renderer');

  const expenseRows = buildRows(transactions, 'EXPENSE');
  const incomeRows = buildRows(transactions, 'INCOME');

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
            Transaction report
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
          <Text style={{ marginBottom: 8, fontSize: 14 }}>Expenses</Text>
          {buildTable(expenseRows, View, Text)}
        </View>
        <View
          style={{
            fontSize: 12,
            padding: 20,
          }}
        >
          <Text style={{ marginBottom: 8, fontSize: 14 }}>Income</Text>
          {buildTable(incomeRows, View, Text)}
        </View>
      </Page>
    </Document>
  );
}

function buildRows(transactions: Transaction[], type: 'INCOME' | 'EXPENSE'): ReportRow[] {
  const rows: ReportRow[] = [];

  transactions.forEach(tx => {
    tx.splits
      .filter(split => split.account.type === type && split.account.report !== false)
      .forEach(split => {
        rows.push({
          guid: `${tx.guid}-${split.guid}`,
          date: tx.date.toFormat('dd/MM/yyyy'),
          description: tx.description,
          accountName: split.account.name,
          amount: formatSplitAmount(split, type),
        });
      });
  });

  return rows;
}

function formatSplitAmount(split: Split, type: 'INCOME' | 'EXPENSE'): string {
  const quantity = type === 'INCOME' ? Math.abs(split.quantity) : split.quantity;
  return new Money(quantity, split.account.commodity.mnemonic).format();
}

function buildTable(
  rows: ReportRow[],
  View: any,
  Text: any,
) {
  if (rows.length === 0) {
    return (
      <Text>No transactions</Text>
    );
  }

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: '#000',
          paddingBottom: 4,
          marginBottom: 4,
        }}
      >
        <Text style={{ width: '18%' }}>Date</Text>
        <Text style={{ width: '42%' }}>Description</Text>
        <Text style={{ width: '22%' }}>Account</Text>
        <Text style={{ width: '18%', textAlign: 'right' }}>Amount</Text>
      </View>
      {rows.map(row => (
        <View
          key={row.guid}
          style={{
            flexDirection: 'row',
            marginTop: 3,
          }}
        >
          <Text style={{ width: '18%' }}>{row.date}</Text>
          <Text style={{ width: '42%' }}>{row.description}</Text>
          <Text style={{ width: '22%' }}>{row.accountName}</Text>
          <Text style={{ width: '18%', textAlign: 'right' }}>{row.amount}</Text>
        </View>
      ))}
    </View>
  );
}
