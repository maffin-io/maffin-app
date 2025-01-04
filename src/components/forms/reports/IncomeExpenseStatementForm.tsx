'use client';

import React from 'react';
import { Interval } from 'luxon';
import { Controller, useForm } from 'react-hook-form';

import DateRangeInput from '@/components/DateRangeInput';
import { useInterval } from '@/hooks/state';
import IncomeExpenseStatement from '@/templates/pdf/IncomeExpenseStatement';
import { useAccounts, useIncomeStatement } from '@/hooks/api';
import type { Account } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';

type FormValues = {
  interval?: Interval;
};

export default function IncomeExpenseStatementForm(): React.JSX.Element {
  const { data: interval } = useInterval();
  const form = useForm<FormValues>({
    defaultValues: {
      interval,
    },
  });

  const i = form.watch('interval');

  const { data: accounts } = useAccounts();
  const { data: totals } = useIncomeStatement(i);

  return (
    <form
      onSubmit={form.handleSubmit(data => onSubmit(
        data,
        accounts as Account[],
        totals as AccountsTotals,
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

async function onSubmit(data: FormValues, accounts: Account[], totals: AccountsTotals) {
  const { pdf } = await import('@react-pdf/renderer');
  const myDoc = await IncomeExpenseStatement({
    interval: data.interval as Interval,
    accounts,
    totals,
  });
  const blob = await pdf(myDoc).toBlob();
  window.open(URL.createObjectURL(blob));
}
