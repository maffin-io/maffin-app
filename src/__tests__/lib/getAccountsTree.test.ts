import { Account } from '@/book/entities';
import getAccountsTree from '@/lib/getAccountsTree';

describe('getAccountsTree', () => {
  let root: Account;

  it('returns empty tree when no accounts', () => {
    root = {
      guid: 'a',
      type: 'ROOT',
      name: 'Root',
      childrenIds: [] as string[],
    } as Account;

    expect(
      getAccountsTree(root, []),
    ).toEqual({
      account: root,
      leaves: [],
    });
  });

  it('generates nested tree structure', () => {
    const accounts = {
      root: {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a1'],
      } as Account,
      a1: {
        guid: 'a1',
        name: 'Assets',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        childrenIds: ['a2'],
      } as Account,
      a2: {
        guid: 'a2',
        name: 'Bank',
        commodity: {
          mnemonic: 'USD',
        },
        type: 'BANK',
        childrenIds: [] as string[],
      } as Account,
    };

    expect(
      getAccountsTree(accounts.root, accounts),
    ).toEqual({
      account: accounts.root,
      leaves: [
        {
          account: accounts.a1,
          leaves: [
            {
              account: accounts.a2,
              leaves: [],
            },
          ],
        },
      ],
    });
  });
});
