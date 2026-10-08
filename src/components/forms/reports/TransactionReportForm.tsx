'use client';

import React from 'react';
import { Interval } from 'luxon';
import { Controller, useForm } from 'react-hook-form';

import DateRangeInput from '@/components/DateRangeInput';
import ReportFormatInput from '@/components/forms/reports/ReportFormatInput';
import type { ReportFormat } from '@/components/forms/reports/ReportFormatInput';
import { useInterval } from '@/hooks/state';
import TransactionReport from '@/templates/pdf/TransactionReport';
import TransactionReportExcel from '@/templates/excel/TransactionReport';
import downloadBlob from '@/helpers/downloadBlob';
import { useAccounts, useTransactionsReport } from '@/hooks/api';
import type { Account, Transaction } from '@/book/entities';
import { isOrphanSplit } from '@/lib/queries/getTransactionsReport';

type FormValues = {
  interval?: Interval;
  format: ReportFormat;
};

export default function TransactionReportForm(): React.JSX.Element {
  const { data: interval } = useInterval();
  const form = useForm<FormValues>({
    defaultValues: {
      interval,
      format: 'pdf',
    },
  });

  const i = form.watch('interval');
  const { data: accounts } = useAccounts();
  const { data: transactions } = useTransactionsReport(i);
  const orphanCount = (transactions || []).filter(
    tx => tx.splits.some(isOrphanSplit),
  ).length;

  return (
    <form
      onSubmit={form.handleSubmit(data => onSubmit(
        data,
        transactions as Transaction[],
        accounts as Account[],
      ))}
    >
      <div className="flex flex-col items-center text-sm gap-2 pt-5">
        <fieldset>
          <label htmlFor="intervalInput" className="inline-block text-sm my-2">Select dates</label>
          <Controller
            control={form.control}
            name="interval"
            render={({ field }) => (
              <DateRangeInput
                id="intervalInput"
                interval={interval}
                onChange={field.onChange}
              />
            )}
          />
        </fieldset>
        <ReportFormatInput registration={form.register('format')} />
        {orphanCount > 0 && (
          <p
            className="badge bg-warning h-auto py-1 text-center whitespace-normal"
            data-testid="orphan-warning"
          >
            {`${orphanCount} transaction(s) in this period reference deleted accounts. They are listed as Orphan in the report.`}
          </p>
        )}
      </div>

      <div className="flex w-full justify-center mt-5">
        <button
          className="btn btn-primary capitalize"
          type="submit"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

async function onSubmit(
  data: FormValues,
  transactions: Transaction[],
  accounts: Account[],
) {
  const props = {
    interval: data.interval as Interval,
    transactions,
    accounts,
  };

  if (data.format === 'excel') {
    const blob = await TransactionReportExcel(props);
    downloadBlob(blob, `transaction-report_${props.interval.toISODate().replace('/', '_')}.xlsx`);
    return;
  }

  const { pdf } = await import('@react-pdf/renderer');
  const myDoc = await TransactionReport(props);
  const blob = await pdf(myDoc).toBlob();
  window.open(URL.createObjectURL(blob));
}
