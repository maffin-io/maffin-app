import { Split } from '../../entities';
import { getSplits } from '../../queries';

describe('getSplits', () => {
  it('returns splits as expected', async () => {
    jest.spyOn(Split, 'find').mockResolvedValue([{ guid: 'guid' } as Split]);
    const splits = await getSplits('guid');

    expect(Split.find).toBeCalledWith(
      {
        where: {
          fk_account: {
            guid: 'guid',
          },
        },
        relations: {
          fk_transaction: {
            splits: {
              fk_account: true,
            },
          },
          fk_account: true,
        },
        order: {
          fk_transaction: {
            date: 'DESC',
          },
          quantityNum: 'ASC',
        },
      },
    );
    expect(splits).toEqual([{ guid: 'guid' }]);
  });
});
