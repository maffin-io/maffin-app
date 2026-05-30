import visibleAccountGuids, { visibleChildIds } from '@/helpers/visibleAccountGuids';
import type { Account } from '@/book/entities';
import mapAccounts from '@/helpers/mapAccounts';

describe('visibleAccountGuids', () => {
  const accounts = [
    {
      guid: 'root',
      name: 'Root',
      type: 'ROOT',
      childrenIds: ['visible', 'hidden'],
    } as Account,
    {
      guid: 'visible',
      name: 'Visible',
      type: 'INCOME',
      parentId: 'root',
      childrenIds: [],
    } as Account,
    {
      guid: 'hidden',
      name: 'Hidden',
      type: 'INCOME',
      parentId: 'root',
      childrenIds: [],
      hidden: true,
    } as Account,
  ];

  it('returns guids unchanged when accounts are undefined', () => {
    expect(visibleAccountGuids(['visible', 'hidden'], undefined)).toEqual(['visible', 'hidden']);
  });

  it('filters hidden account guids', () => {
    expect(visibleAccountGuids(['visible', 'hidden'], accounts)).toEqual(['visible']);
  });

  it('returns visible child ids', () => {
    const accountsMap = mapAccounts(accounts);

    expect(visibleChildIds(accountsMap, accountsMap.root)).toEqual(['visible']);
  });
});
