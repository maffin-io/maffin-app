import React from 'react';
import Datepicker from 'react-tailwindcss-datepicker';
import { DateTime, Interval } from 'luxon';

import { useStartDate } from '@/hooks/api';
import { useInterval } from '@/hooks/state';
import { useQueryClient } from '@tanstack/react-query';

export default function DateRangeInput(): JSX.Element {
  const { data: earliestDate } = useStartDate();
  const queryClient = useQueryClient();
  const { data: interval } = useInterval();

  const now = DateTime.now();
  const shortcuts: { [key: string]: { text: string, period: { start: Date, end: Date } } } = {
    t3: {
      text: 'Last 3 months',
      period: {
        start: now.minus({ months: 2 }).startOf('month').toJSDate(),
        end: now.endOf('day').toJSDate(),
      },
    },
    t: {
      text: 'Last 6 months',
      period: {
        start: now.minus({ months: 5 }).startOf('month').toJSDate(),
        end: now.endOf('day').toJSDate(),
      },
    },
  };

  Array.from(
    { length: now.year - (earliestDate?.year || now.year) },
    (x, i) => i + 1,
  ).forEach(value => {
    const yearDiff = value as number;
    const key = now.year - yearDiff;
    shortcuts[key] = {
      text: `Year ${now.year - yearDiff}`,
      period: {
        start: now.minus(
          { year: yearDiff },
        ).startOf('year').toJSDate(),
        end: now.minus({ year: yearDiff }).endOf('year').toJSDate(),
      },
    };
  });

  return (
    <Datepicker
      value={{
        startDate: interval.start?.toJSDate() || null,
        endDate: interval.end?.toJSDate() || null,
      }}
      minDate={earliestDate && earliestDate.toJSDate()}
      maxDate={now.toJSDate()}
      displayFormat="DD-MM-YYYY"
      placeholder="Select date range"
      primaryColor="cyan"
      onChange={(newValue) => {
        if (newValue) {
          queryClient.setQueryData(
            ['state', 'interval'],
            Interval.fromDateTimes(
              DateTime.fromISO(newValue.startDate as string),
              DateTime.fromISO(newValue.endDate as string).endOf('day'),
            ),
          );
        }
      }}
      startWeekOn="mon"
      popoverDirection="down"
      showShortcuts
      configs={{
        shortcuts,
      }}
      containerClassName="relative text-sm"
      inputClassName="relative transition-all duration-300 text-right py-2.5 px-4 rounded-lg tracking-wide bg-light-100 dark:bg-dark-800 w-[220px]"
      toggleClassName="hidden"
    />
  );
}
