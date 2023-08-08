import { getLatestTxs } from '@/book/queries';
import { Transaction } from '@/book/entities';

describe('getLatestTsx', () => {
  it('calls find as expected', async () => {
    jest.spyOn(Transaction, 'find').mockResolvedValue([{} as Transaction]);
    const txs = await getLatestTxs();

    expect(txs).toEqual([{}]);
    expect(Transaction.find).toBeCalledWith({
      relations: {
        splits: {
          fk_account: true,
        },
      },
      order: {
        date: 'DESC',
      },
      take: 5,
    });
  });
});
