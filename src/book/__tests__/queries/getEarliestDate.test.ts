import { DateTime } from 'luxon';

import { Transaction } from '@/book/entities';
import { getEarliestDate } from '@/book/queries';

describe('getEarliestDate', () => {
  beforeEach(() => {
    jest.spyOn(Transaction, 'query').mockResolvedValue([]);
  });

  it('sends expected query', async () => {
    jest.spyOn(Transaction, 'query').mockResolvedValue([{ date: '2023-01-02' }]);

    const date = await getEarliestDate();
    expect(date).toEqual(DateTime.fromISO('2023-01-02'));
    expect(Transaction.query).toBeCalledWith('SELECT MIN(post_date) as date FROM transactions;');
  });

  it('returns default when no transactions', async () => {
    jest.spyOn(Transaction, 'query').mockResolvedValue([]);

    const date = await getEarliestDate();
    expect(date).toEqual(DateTime.now().startOf('year'));
  });
});
