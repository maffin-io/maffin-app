import React from 'react';
import Datepicker from 'react-tailwindcss-datepicker';
import { DateTime } from 'luxon';

export type DateRangeInputProps = {
  asSingle?: boolean,
  earliestDate?: DateTime,
  dateRange?: {
    start?: DateTime,
    end?: DateTime,
  },
  onChange: Function,
};

export default function DateRangeInput({
  earliestDate,
  dateRange = {},
  onChange,
  asSingle = false,
}: DateRangeInputProps): JSX.Element {
  const now = DateTime.now();
  const shortcuts: { [key: string]: { text: string, period: { start: Date, end: Date } } } = {
    today: {
      text: 'Today',
      period: {
        start: now.toJSDate(),
        end: now.toJSDate(),
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
      text: `End of ${now.year - yearDiff}`,
      period: {
        start: now.minus({ year: yearDiff }).endOf('year').toJSDate(),
        end: now.minus({ year: yearDiff }).endOf('year').toJSDate(),
      },
    };
  });

  return (
    <Datepicker
      value={{
        startDate: dateRange?.start?.toJSDate() || null,
        endDate: dateRange?.end?.toJSDate() || null,
      }}
      asSingle={asSingle}
      useRange={!asSingle}
      minDate={earliestDate && earliestDate.toJSDate()}
      maxDate={now.toJSDate()}
      displayFormat="DD MMMM YYYY"
      placeholder="Select date range"
      primaryColor="cyan"
      onChange={(newValue) => {
        if (newValue) {
          onChange({
            start: DateTime.fromISO(newValue.startDate as string),
            end: DateTime.fromISO(newValue.endDate as string),
          });
        }
      }}
      startWeekOn="mon"
      separator="-"
      showShortcuts
      configs={{
        shortcuts,
      }}
      containerClassName="relative w-full text-sm"
      inputClassName="relative transition-all duration-300 text-right py-2.5 px-4 rounded-lg tracking-wide bg-white dark:bg-dark-700"
      toggleClassName="hidden"
    />
  );
}
