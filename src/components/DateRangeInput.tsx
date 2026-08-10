import React from 'react';
import Datepicker from 'react-tailwindcss-datepicker';
import { DateTime, Interval } from 'luxon';

import { useStartDate } from '@/hooks/api';

export type DateRangeInputProps = {
  id?: string;
  interval: Interval;
  onChange?: (interval: Interval) => void;
};

export default function DateRangeInput({
  id,
  interval,
  onChange,
}: DateRangeInputProps): React.JSX.Element {
  const { data: earliestDate } = useStartDate();
  const [value, setValue] = React.useState(interval);

  const now = DateTime.now();
  const shortcuts: { [key: string]: { text: string, period: { start: Date, end: Date } } } = {
    t6: {
      text: 'Last 6 months',
      period: {
        start: now.minus({ months: 5 }).startOf('month').toJSDate(),
        end: now.toJSDate(),
      },
    },
    t3: {
      text: 'Last 3 months',
      period: {
        start: now.minus({ months: 2 }).startOf('month').toJSDate(),
        end: now.toJSDate(),
      },
    },
    ytd: {
      text: 'Year to date',
      period: {
        start: now.startOf('year').toJSDate(),
        end: now.toJSDate(),
      },
    },
  };

  Array.from(
    { length: now.year - (earliestDate?.year || now.year) },
    (x, i) => i + 1,
  ).forEach(v => {
    const yearDiff = v as number;
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
      inputId={id}
      value={{
        startDate: value.start?.toJSDate() || null,
        endDate: value.end?.toJSDate() || null,
      }}
      minDate={earliestDate && earliestDate.toJSDate()}
      maxDate={now.toJSDate()}
      displayFormat="DD-MM-YYYY"
      placeholder="Select date range"
      primaryColor="cyan"
      onChange={(newValue) => {
        if (newValue) {
          const v = Interval.fromDateTimes(
            DateTime.fromJSDate(newValue.startDate as Date),
            DateTime.fromJSDate(newValue.endDate as Date).endOf('day'),
          );
          setValue(v);
          onChange?.(v);
        }
      }}
      startWeekOn="mon"
      popoverDirection="down"
      showShortcuts
      configs={{
        shortcuts,
      }}
      containerClassName="relative text-sm"
      inputClassName="relative transition-all duration-300 text-right py-2.5 px-4 rounded-lg tracking-wide w-[220px]"
      toggleClassName="hidden"
    />
  );
}
