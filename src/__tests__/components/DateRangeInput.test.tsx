import React from 'react';
import { render } from '@testing-library/react';
import Datepicker from 'react-tailwindcss-datepicker';
import { DateTime, Interval } from 'luxon';

import DateRangeInput from '@/components/DateRangeInput';

jest.mock('react-tailwindcss-datepicker', () => jest.fn(
  () => <div data-testid="DatePicker" />,
));

describe('DateRangeInput', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-30', { zone: 'utc' }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates datepicker with expected params', () => {
    render(<DateRangeInput onChange={jest.fn()} />);

    expect(Datepicker).toBeCalledTimes(1);
    expect(Datepicker).toBeCalledWith(
      {
        containerClassName: 'relative w-full text-sm text-slate-400',
        displayFormat: 'DD/MMM/YY',
        inputClassName: 'relative transition-all duration-300 py-2.5 pl-4 pr-14 w-full border-gray-300 rounded-lg tracking-wide placeholder-gray-400 bg-gunmetal-700',
        maxDate: DateTime.now().toJSDate(),
        minDate: undefined,
        onChange: expect.any(Function),
        placeholder: 'Select date range',
        primaryColor: 'cyan',
        separator: '-',
        showShortcuts: true,
        startWeekOn: 'mon',
        value: {
          startDate: DateTime.now().startOf('year').toJSDate(),
          endDate: DateTime.now().toJSDate(),
        },
        configs: {
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
                start: DateTime.now().minus({ years: 10 }).toJSDate(),
                end: DateTime.now().toJSDate(),
              },
            },
          },
        },
      },
      {},
    );
  });

  it('sets dateRange and earliestDate', () => {
    render(
      <DateRangeInput
        onChange={jest.fn()}
        dateRange={Interval.fromDateTimes(
          DateTime.fromISO('2023-01-01'),
          DateTime.fromISO('2023-01-05'),
        )}
        earliestDate={DateTime.fromISO('2022-01-01')}
      />,
    );

    expect(Datepicker).toBeCalledWith(
      expect.objectContaining({
        value: {
          startDate: DateTime.fromISO('2023-01-01').toJSDate(),
          endDate: DateTime.fromISO('2023-01-05').toJSDate(),
        },
        minDate: DateTime.fromISO('2022-01-01').toJSDate(),
        configs: {
          shortcuts: expect.objectContaining({
            all: {
              text: 'All',
              period: {
                start: DateTime.fromISO('2022-01-01').toJSDate(),
                end: DateTime.now().toJSDate(),
              },
            },
          }),
        },
      }),
      {},
    );
  });
});
