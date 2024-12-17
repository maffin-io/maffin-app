import React from 'react';
import { act, render } from '@testing-library/react';
import Datepicker from 'react-tailwindcss-datepicker';
import { DateTime, Interval } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import DateRangeInput from '@/components/DateRangeInput';
import * as apiHook from '@/hooks/api';

jest.mock('react-tailwindcss-datepicker', () => jest.fn(
  () => <div data-testid="DatePicker" />,
));

jest.mock('@tanstack/react-query', () => ({
  __esModule: true,
  ...jest.requireActual('@tanstack/react-query'),
}));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('DateRangeInput', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-30') as DateTime<true>);
    jest.spyOn(apiHook, 'useStartDate').mockReturnValue({ data: undefined } as UseQueryResult<DateTime>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates datepicker with expected params', () => {
    render(<DateRangeInput interval={TEST_INTERVAL} />);

    expect(Datepicker).toHaveBeenCalledTimes(1);
    expect(Datepicker).toHaveBeenCalledWith(
      {
        containerClassName: 'relative text-sm',
        displayFormat: 'DD-MM-YYYY',
        inputClassName: 'relative transition-all duration-300 text-right py-2.5 px-4 rounded-lg tracking-wide w-[220px]',
        toggleClassName: 'hidden',
        maxDate: DateTime.now().toJSDate(),
        minDate: undefined,
        onChange: expect.any(Function),
        placeholder: 'Select date range',
        popoverDirection: 'down',
        primaryColor: 'cyan',
        showShortcuts: true,
        startWeekOn: 'mon',
        value: {
          startDate: TEST_INTERVAL.start?.toJSDate(),
          endDate: TEST_INTERVAL.end?.toJSDate(),
        },
        configs: {
          shortcuts: {
            ytd: {
              text: 'Year to date',
              period: {
                start: DateTime.now().startOf('year').toJSDate(),
                end: DateTime.now().toJSDate(),
              },
            },
            t3: {
              text: 'Last 3 months',
              period: {
                start: DateTime.now().minus({ months: 2 }).startOf('month').toJSDate(),
                end: DateTime.now().toJSDate(),
              },
            },
            t6: {
              text: 'Last 6 months',
              period: {
                start: DateTime.now().minus({ months: 5 }).startOf('month').toJSDate(),
                end: DateTime.now().toJSDate(),
              },
            },
          },
        },
      },
      undefined,
    );
  });

  it('sets earliestDate', () => {
    jest.spyOn(apiHook, 'useStartDate').mockReturnValue({
      data: DateTime.fromISO('2022-01-01'),
    } as UseQueryResult<DateTime>);

    render(<DateRangeInput interval={TEST_INTERVAL} />);

    expect(Datepicker).toHaveBeenCalledWith(
      expect.objectContaining({
        value: {
          startDate: TEST_INTERVAL.start?.toJSDate(),
          endDate: TEST_INTERVAL.end?.toJSDate(),
        },
        minDate: DateTime.fromISO('2022-01-01').toJSDate(),
        configs: {
          shortcuts: expect.objectContaining({
            2022: {
              text: 'Year 2022',
              period: {
                start: DateTime.fromISO('2022').startOf('year').toJSDate(),
                end: DateTime.fromISO('2022').endOf('year').toJSDate(),
              },
            },
          }),
        },
      }),
      undefined,
    );
  });

  /**
   * We want this to happen so Interval.spliBy generates proper intervals
   * for displaying amount of columns we want. If we pass an interval with
   * end date as 1st of the month without setting end of day, that month
   * will not be included
   */
  it('calls on change with end of date for end date', () => {
    const onChange = jest.fn();
    render(<DateRangeInput interval={TEST_INTERVAL} onChange={onChange} />);

    const { onChange: f } = (Datepicker as jest.Mock).mock.calls[0][0];
    act(() => f({
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-09'),
    }));
    expect(onChange).toHaveBeenCalledWith(
      Interval.fromDateTimes(
        DateTime.fromISO('2023-01-01'),
        DateTime.fromISO('2023-01-09').endOf('day'),
      ),
    );
  });
});
