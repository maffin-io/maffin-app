import visibleAccountGuids, {
  visibleChildIds,
  reportChildIds,
  isReportAccount,
} from '@/helpers/visibleAccountGuids';
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

  it('includes explicitly requested hidden account guids', () => {
    expect(visibleAccountGuids(['visible', 'hidden'], accounts, ['hidden'])).toEqual(['visible', 'hidden']);
    expect(visibleAccountGuids(['hidden'], accounts, ['hidden'])).toEqual(['hidden']);
  });

  it('returns visible child ids', () => {
    const accountsMap = mapAccounts(accounts);

    expect(visibleChildIds(accountsMap, accountsMap.root)).toEqual(['visible']);
  });

  it('returns reportable child ids', () => {
    const withReport = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['visible', 'hidden', 'no-report'],
      } as Account,
      accounts[1],
      accounts[2],
      {
        guid: 'no-report',
        name: 'No report',
        type: 'INCOME',
        parentId: 'root',
        childrenIds: [],
        report: false,
      } as Account,
    ];
    const accountsMap = mapAccounts(withReport);

    expect(reportChildIds(accountsMap, accountsMap.root)).toEqual(['visible', 'hidden']);
  });

  it('treats missing report flag as reportable', () => {
    expect(isReportAccount({ guid: 'a' } as Account)).toEqual(true);
    expect(isReportAccount({ guid: 'a', report: true } as Account)).toEqual(true);
    expect(isReportAccount({ guid: 'a', report: false } as Account)).toEqual(false);
  });
});
