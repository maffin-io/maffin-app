import { DateTime, Interval } from 'luxon';

import monthlyDates from '@/helpers/monthlyDates';

describe('monthlyDates', () => {
  it('generates dates as expected when start of day 1', () => {
    const dates = monthlyDates(Interval.fromDateTimes(
      DateTime.fromISO('2023-11-01'),
      DateTime.fromISO('2024-01-01'),
    ));

    expect(dates).toEqual([
      DateTime.fromISO('2023-11-01'),
      DateTime.fromISO('2023-12-01'),
    ]);
  });

  it('generates dates as expected when end of day 1', () => {
    const dates = monthlyDates(Interval.fromDateTimes(
      DateTime.fromISO('2023-11-01'),
      DateTime.fromISO('2024-01-01').endOf('day'),
    ));

    expect(dates).toEqual([
      DateTime.fromISO('2023-11-01'),
      DateTime.fromISO('2023-12-01'),
      DateTime.fromISO('2024-01-01'),
    ]);
  });

  it('generates dates as expected mid month', () => {
    const dates = monthlyDates(Interval.fromDateTimes(
      DateTime.fromISO('2023-11-15'),
      DateTime.fromISO('2024-01-30'),
    ));

    expect(dates).toEqual([
      DateTime.fromISO('2023-11-01'),
      DateTime.fromISO('2023-12-01'),
      DateTime.fromISO('2024-01-01'),
    ]);
  });
});
