import React from 'react';
import Datepicker from 'react-tailwindcss-datepicker';
import { DateTime, Interval } from 'luxon';

export type DateRangeInputProps = {
  earliestDate?: DateTime,
  dateRange?: Interval,
  onChange: Function,
};

export default function DateRangeInput({
  earliestDate,
  dateRange = Interval.fromDateTimes(
    DateTime.now().startOf('year'),
    DateTime.now(),
  ),
  onChange,
}: DateRangeInputProps): JSX.Element {
  return (
    <Datepicker
      value={{
        startDate: (dateRange?.start?.toJSDate() || null),
        endDate: (dateRange?.end?.toJSDate() || null),
      }}
      minDate={earliestDate && earliestDate.toJSDate()}
      maxDate={DateTime.now().toJSDate()}
      displayFormat="DD/MMM/YY"
      placeholder="Select date range"
      primaryColor="cyan"
      onChange={(newValue) => {
        if (newValue?.startDate && newValue?.endDate) {
          onChange(Interval.fromDateTimes(
            DateTime.fromISO(newValue.startDate as string),
            DateTime.fromISO(newValue.endDate as string),
          ));
        }
      }}
      startWeekOn="mon"
      separator="-"
      showShortcuts
      configs={{
        shortcuts: {
          yearToDate: {
            text: 'Year to date',
            period: {
              start: DateTime.now().startOf('year').toJSDate(),
              end: DateTime.now().toJSDate(),
            },
          },
          previousYear: {
            text: 'Previous year',
            period: {
              start: DateTime.now().minus({ years: 1 }).startOf('year').toJSDate(),
              end: DateTime.now().minus({ years: 1 }).endOf('year').toJSDate(),
            },
          },
          last3Years: {
            text: 'Last 3 years',
            period: {
              start: DateTime.now().minus({ years: 3 }).startOf('year').toJSDate(),
              end: DateTime.now().toJSDate(),
            },
          },
          all: {
            text: 'All',
            period: {
              start: (earliestDate || DateTime.now().minus({ years: 10 })).toJSDate(),
              end: DateTime.now().toJSDate(),
            },
          },
        },
      }}
      containerClassName="relative w-full text-sm text-slate-400"
      inputClassName="relative transition-all duration-300 py-2.5 pl-4 pr-14 w-full border-gray-300 rounded-lg tracking-wide placeholder-gray-400 bg-gunmetal-700"
    />
  );
}
