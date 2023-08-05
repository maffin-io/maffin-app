import React from 'react';
import { render } from '@testing-library/react';
import Datepicker from 'react-tailwindcss-datepicker';
import { DateTime } from 'luxon';

import DateRangeInput from '@/components/DateRangeInput';

jest.mock('react-tailwindcss-datepicker', () => jest.fn(
  () => <div data-testid="DatePicker" />,
));

describe('DateRangeInput', () => {
  beforeEach(() => {
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-30'));
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
          startDate: null,
          endDate: null,
        },
        configs: {
          shortcuts: {
            today: {
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
        earliestDate={DateTime.fromISO('2022-01-01')}
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
            today: {
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
