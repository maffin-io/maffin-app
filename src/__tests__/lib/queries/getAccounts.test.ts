import { Account } from '@/book/entities';
import { getAccounts } from '@/lib/queries';

describe('getAccounts', () => {
  beforeEach(() => {
    jest.spyOn(Account, 'find').mockResolvedValue([]);
  });

  it('calls find with expected params', async () => {
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
        name: '1',
      } as Account,
      {
        guid: '2',
        name: '2',
      } as Account,
    ];
    jest.spyOn(Account, 'find').mockResolvedValue(expectedAccounts);
    const accounts = await getAccounts();

    expect(accounts).toEqual({
      1: expectedAccounts[0],
      2: expectedAccounts[1],
    });
  });

  it('stores root account in proper key', async () => {
    const expectedAccounts = [
      {
        guid: '1',
        type: 'ROOT',
        name: 'Root',
      } as Account,
      {
        guid: '2',
        name: '2',
      } as Account,
    ];
    jest.spyOn(Account, 'find').mockResolvedValue(expectedAccounts);
    const accounts = await getAccounts();

    expect(accounts).toEqual({
      root: expectedAccounts[0],
      1: expectedAccounts[0],
      2: expectedAccounts[1],
    });
  });

  /**
   * Seems template root is a default account that gnucash creates
   * so we dont want to set that one as root
   */
  it('ignores template root account', async () => {
    const expectedAccounts = [
      {
        guid: '1',
        type: 'ROOT',
        name: 'Root',
      } as Account,
      {
        guid: '2',
        type: 'ROOT',
        name: 'Template root',
      } as Account,
    ];
    jest.spyOn(Account, 'find').mockResolvedValue(expectedAccounts);
    const accounts = await getAccounts();

    expect(accounts).toEqual({
      root: expectedAccounts[0],
      1: expectedAccounts[0],
      2: expectedAccounts[1],
    });
  });
});
