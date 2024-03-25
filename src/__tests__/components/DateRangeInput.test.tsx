import React from 'react';
import { render } from '@testing-library/react';
import Datepicker from 'react-tailwindcss-datepicker';
import { DateTime, Interval } from 'luxon';
import { DefinedUseQueryResult, QueryClientProvider } from '@tanstack/react-query';
import * as query from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import DateRangeInput from '@/components/DateRangeInput';
import * as apiHook from '@/hooks/api';
import * as stateHooks from '@/hooks/state';

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

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('DateRangeInput', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-30') as DateTime<true>);
    jest.spyOn(apiHook, 'useStartDate').mockReturnValue({ data: undefined } as UseQueryResult<DateTime>);
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates datepicker with expected params', () => {
    render(<DateRangeInput />, { wrapper });

    expect(Datepicker).toBeCalledTimes(1);
    expect(Datepicker).toBeCalledWith(
      {
        containerClassName: 'relative text-sm',
        displayFormat: 'DD-MM-YYYY',
        inputClassName: 'relative transition-all duration-300 text-right py-2.5 px-4 rounded-lg tracking-wide bg-light-100 dark:bg-dark-800 w-[220px]',
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
      {},
    );
  });

  it('sets earliestDate', () => {
    jest.spyOn(apiHook, 'useStartDate').mockReturnValue({
      data: DateTime.fromISO('2022-01-01'),
    } as UseQueryResult<DateTime>);

    render(<DateRangeInput />, { wrapper });

    expect(Datepicker).toBeCalledWith(
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
      {},
    );
  });

  /**
   * We want this to happen so Interval.spliBy generates proper intervals
   * for displaying amount of columns we want. If we pass an interval with
   * end date as 1st of the month without setting end of day, that month
   * will not be included
   */
  it('updates query data with selection setting end of day for end date', () => {
    const mockSetQueryData = jest.fn();
    jest.spyOn(query, 'useQueryClient').mockReturnValue({
      setQueryData: mockSetQueryData as QueryClient['setQueryData'],
    } as QueryClient);
    render(<DateRangeInput />, { wrapper });

    const { onChange } = (Datepicker as jest.Mock).mock.calls[0][0];
    onChange({
      startDate: DateTime.fromISO('2022-01-01'),
      endDate: DateTime.fromISO('2023-01-01'),
    });

    expect(mockSetQueryData).toBeCalledWith(
      ['state', 'interval'],
      Interval.fromDateTimes(
        DateTime.fromISO('2022-01-01'),
        DateTime.fromISO('2023-01-01').endOf('day'),
      ),
    );
  });
});
