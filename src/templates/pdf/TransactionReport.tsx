import React from 'react';
import { Interval } from 'luxon';

import type { Account, Transaction } from '@/book/entities';
import getTransactionReportSections from '@/lib/reports/transactionReport';
import type { TransactionReportRow } from '@/lib/reports/transactionReport';

export type TransactionReportProps = {
  interval: Interval;
  transactions: Transaction[],
  accounts: Account[],
};

export default async function TransactionReport({
  interval,
  transactions,
  accounts,
}: TransactionReportProps) {
  // This is horrible but couldn't manage to import react-pdf properly as it is giving
  // errors even when using nextjs dynamic
  const {
    Page,
    Text,
    View,
    Document,
  } = await import('@react-pdf/renderer');

  const { expenses, income, orphans } = getTransactionReportSections(transactions, accounts);

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
          {orphans.length > 0 && (
            <Text style={{ marginTop: 8, fontSize: 11, color: '#b45309' }}>
              {`Warning: ${orphans.length} split(s) belong to accounts that no longer exist. See the Orphan section below.`}
            </Text>
          )}
        </View>
        <View
          style={{
            fontSize: 12,
            padding: 20,
          }}
        >
          <Text style={{ marginBottom: 8, fontSize: 14 }}>Expenses</Text>
          {buildTable(expenses, View, Text)}
        </View>
        <View
          style={{
            fontSize: 12,
            padding: 20,
          }}
        >
          <Text style={{ marginBottom: 8, fontSize: 14 }}>Income</Text>
          {buildTable(income, View, Text)}
        </View>
        {orphans.length > 0 && (
          <View
            style={{
              fontSize: 12,
              padding: 20,
            }}
          >
            <Text style={{ marginBottom: 4, fontSize: 14 }}>Orphan</Text>
            <Text style={{ marginBottom: 8, fontSize: 10 }}>
              These transactions reference deleted accounts. Assign them to an existing account.
            </Text>
            {buildTable(orphans, View, Text)}
          </View>
        )}
      </Page>
    </Document>
  );
}

function buildTable(
  rows: TransactionReportRow[],
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
        <Text style={{ width: '16%' }}>Date</Text>
        <Text style={{ width: '36%' }}>Description</Text>
        <Text style={{ width: '30%' }}>Account</Text>
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
          <Text style={{ width: '16%' }}>{row.date.toFormat('dd/MM/yyyy')}</Text>
          <Text style={{ width: '36%' }}>{row.description}</Text>
          <Text style={{ width: '30%' }}>{row.accountName}</Text>
          <Text style={{ width: '18%', textAlign: 'right' }}>{row.amount.format()}</Text>
        </View>
      ))}
    </View>
  );
}
