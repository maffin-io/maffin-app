import React from 'react';
import { render } from '@testing-library/react';
import Datepicker from 'react-tailwindcss-datepicker';
import { DateTime } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import DateRangeInput from '@/components/DateRangeInput';
import * as apiHook from '@/hooks/api';

jest.mock('react-tailwindcss-datepicker', () => jest.fn(
  () => <div data-testid="DatePicker" />,
));

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
    render(<DateRangeInput onChange={jest.fn()} />);

    expect(Datepicker).toBeCalledTimes(1);
    expect(Datepicker).toBeCalledWith(
      {
        asSingle: false,
        useRange: true,
        containerClassName: 'relative w-full text-sm',
        displayFormat: 'DD MMMM YYYY',
        inputClassName: 'relative transition-all duration-300 text-right py-2.5 px-4 rounded-lg tracking-wide bg-white dark:bg-dark-700',
        toggleClassName: 'hidden',
        maxDate: DateTime.now().toJSDate(),
        minDate: undefined,
        onChange: expect.any(Function),
        placeholder: 'Select date range',
        popoverDirection: 'down',
        primaryColor: 'cyan',
        separator: '-',
        showShortcuts: true,
        startWeekOn: 'mon',
        value: {
          startDate: null,
          endDate: null,
        },
        configs: {
          shortcuts: {
            t: {
              text: 'Today',
              period: {
                start: DateTime.now().toJSDate(),
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
    jest.spyOn(apiHook, 'useStartDate').mockReturnValue({
      data: DateTime.fromISO('2022-01-01'),
    } as UseQueryResult<DateTime>);

    render(
      <DateRangeInput
        asSingle
        onChange={jest.fn()}
        dateRange={
          {
            start: DateTime.fromISO('2023-05-01'),
            end: DateTime.fromISO('2023-05-01'),
          }
        }
      />,
    );

    expect(Datepicker).toBeCalledWith(
      expect.objectContaining({
        asSingle: true,
        useRange: false,
        value: {
          startDate: DateTime.fromISO('2023-05-01').toJSDate(),
          endDate: DateTime.fromISO('2023-05-01').toJSDate(),
        },
        minDate: DateTime.fromISO('2022-01-01').toJSDate(),
        configs: {
          shortcuts: expect.objectContaining({
            t: {
              text: 'Today',
              period: {
                start: DateTime.fromISO('2023-01-30').toJSDate(),
                end: DateTime.fromISO('2023-01-30').toJSDate(),
              },
            },
            2022: {
              text: 'End of 2022',
              period: {
                start: DateTime.fromISO('2022-01-01').endOf('year').toJSDate(),
                end: DateTime.fromISO('2022-01-01').endOf('year').toJSDate(),
              },
            },
          }),
        },
      }),
      {},
    );
  });
});
