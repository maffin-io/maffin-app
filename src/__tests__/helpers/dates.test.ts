import { DateTime, Interval } from 'luxon';

import { intervalToDates } from '@/helpers/dates';

describe('dates', () => {
  it('generates dates as expected when start of day 1', () => {
    const dates = intervalToDates(Interval.fromDateTimes(
      DateTime.fromISO('2023-11-01'),
      DateTime.fromISO('2024-01-01'),
    ));

    expect(dates).toEqual([
      DateTime.fromISO('2023-11-30'),
      DateTime.fromISO('2023-12-31'),
      DateTime.fromISO('2024-01-01'),
    ]);
  });

  it('generates dates as expected when end of day 1', () => {
    const dates = intervalToDates(Interval.fromDateTimes(
      DateTime.fromISO('2023-11-01'),
      DateTime.fromISO('2024-01-01').endOf('day'),
    ));

    expect(dates).toEqual([
      DateTime.fromISO('2023-11-30'),
      DateTime.fromISO('2023-12-31'),
      DateTime.fromISO('2024-01-01'),
    ]);
  });

  it('generates dates as expected mid month', () => {
    const dates = intervalToDates(Interval.fromDateTimes(
      DateTime.fromISO('2023-11-15'),
      DateTime.fromISO('2024-01-30'),
    ));

    expect(dates).toEqual([
      DateTime.fromISO('2023-11-30'),
      DateTime.fromISO('2023-12-31'),
      DateTime.fromISO('2024-01-30'),
    ]);
  });

  it('generates dates as end of month', () => {
    const dates = intervalToDates(Interval.fromDateTimes(
      DateTime.fromISO('2023-11-30'),
      DateTime.fromISO('2024-01-31'),
    ));

    expect(dates).toEqual([
      DateTime.fromISO('2023-11-30'),
      DateTime.fromISO('2023-12-31'),
      DateTime.fromISO('2024-01-31'),
    ]);
  });
});
