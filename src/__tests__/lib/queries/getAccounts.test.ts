import { Account } from '@/book/entities';
import { getAccounts } from '@/lib/queries';

describe('getAccounts', () => {
  beforeEach(() => {
    jest.spyOn(Account, 'find').mockImplementation();
  });

  it('calls fins with expected params', async () => {
    await getAccounts();

    expect(Account.find).toBeCalledWith(
      {
        relations: {
          splits: {
            fk_transaction: true,
          },
        },
        order: {
          splits: {
            fk_transaction: {
              date: 'DESC',
            },
            quantityNum: 'ASC',
          },
        },
      },
    );
  });

  it('returns accounts as is', async () => {
    const expectedAccounts = [
      {
        guid: '1',
      } as Account,
      {
        guid: '2',
      } as Account,
    ];
    jest.spyOn(Account, 'find').mockResolvedValue(expectedAccounts);
    const accounts = await getAccounts();

    expect(accounts).toEqual(expectedAccounts);
  });
});
