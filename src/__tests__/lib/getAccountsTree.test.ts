import Money from '@/book/Money';
import type { Account } from '@/book/entities';
import type { AccountsTotals } from '@/types/book';
import getAccountsTree from '@/lib/getAccountsTree';
import mapAccounts from '@/helpers/mapAccounts';

describe('getAccountsTree', () => {
  it('creates tree as expected', () => {
    const accounts = mapAccounts([
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a1', 'a2'],
      } as Account,
      {
        guid: 'a1',
        name: 'Assets',
        description: 'description',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        parentId: 'root',
        childrenIds: [] as string[],
        placeholder: true,
      },
      {
        guid: 'a2',
        name: 'Salary',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'INCOME',
        parentId: 'root',
        childrenIds: [] as string[],
      },
    ] as Account[]);

    const totals = {
      a1: new Money(300, 'EUR'),
      a2: new Money(100, 'EUR'),
    } as AccountsTotals;

    const tree = getAccountsTree(accounts.root, accounts, totals);

    expect(tree).toEqual({
      account: {
        childrenIds: ['a1', 'a2'],
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
      },
      total: expect.any(Money),
      leaves: [
        {
          account: {
            guid: 'a1',
            name: 'Assets',
            type: 'ASSET',
            parentId: 'root',
            description: 'description',
            commodity: {
              mnemonic: 'EUR',
            },
            childrenIds: [],
            placeholder: true,
          },
          leaves: [],
          total: expect.any(Money),
        },
        {
          account: {
            guid: 'a2',
            name: 'Salary',
            type: 'INCOME',
            parentId: 'root',
            commodity: {
              mnemonic: 'EUR',
            },
            childrenIds: [],
          },
          leaves: [],
          total: expect.any(Money),
        },
      ],
    });
  });

  it('ignores hidden accounts', () => {
    const accounts = mapAccounts([
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a1', 'a2'],
      } as Account,
      {
        guid: 'a1',
        name: 'Assets',
        description: 'description',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'ASSET',
        parentId: 'root',
        childrenIds: [] as string[],
        placeholder: true,
      },
      {
        guid: 'a2',
        name: 'Salary',
        commodity: {
          mnemonic: 'EUR',
        },
        type: 'INCOME',
        parentId: 'root',
        childrenIds: [] as string[],
        hidden: true,
      },
    ] as Account[]);

    const totals = {
      a1: new Money(300, 'EUR'),
      a2: new Money(100, 'EUR'),
    } as AccountsTotals;

    const tree = getAccountsTree(accounts.root, accounts, totals);

    expect(tree).toEqual({
      account: {
        childrenIds: ['a1', 'a2'],
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
      },
      total: expect.any(Money),
      leaves: [
        {
          account: {
            guid: 'a1',
            name: 'Assets',
            type: 'ASSET',
            parentId: 'root',
            description: 'description',
            commodity: {
              mnemonic: 'EUR',
            },
            childrenIds: [],
            placeholder: true,
          },
          leaves: [],
          total: expect.any(Money),
        },
      ],
    });
  });
});
