'use client';

import React from 'react';
import { Interval } from 'luxon';
import { Controller, useForm } from 'react-hook-form';

import DateRangeInput from '@/components/DateRangeInput';
import { useInterval } from '@/hooks/state';
import TransactionReport from '@/templates/pdf/TransactionReport';
import { useAccounts, useTransactionsReport } from '@/hooks/api';
import type { Account, Transaction } from '@/book/entities';

type FormValues = {
  interval?: Interval;
};

export default function TransactionReportForm(): React.JSX.Element {
  const { data: interval } = useInterval();
  const form = useForm<FormValues>({
    defaultValues: {
      interval,
    },
  });

  const i = form.watch('interval');
  const { data: accounts } = useAccounts();
  const { data: transactions } = useTransactionsReport(i);

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
  const { pdf } = await import('@react-pdf/renderer');
  const myDoc = await TransactionReport({
    interval: data.interval as Interval,
    transactions,
    accounts,
  });
  const blob = await pdf(myDoc).toBlob();
  window.open(URL.createObjectURL(blob));
}
