import {
  reportChildIds,
  isReportAccount,
} from '@/helpers/visibleAccountGuids';
import type { Account } from '@/book/entities';
import mapAccounts from '@/helpers/mapAccounts';

describe('report account helpers', () => {
  const accounts = [
    {
      guid: 'root',
      name: 'Root',
      type: 'ROOT',
      childrenIds: ['visible', 'hidden', 'no-report'],
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
    {
      guid: 'no-report',
      name: 'No report',
      type: 'INCOME',
      parentId: 'root',
      childrenIds: [],
      report: false,
    } as Account,
  ];

  it('returns reportable child ids', () => {
    const accountsMap = mapAccounts(accounts);

    expect(reportChildIds(accountsMap, accountsMap.root)).toEqual(['visible', 'hidden']);
  });

  it('treats missing report flag as reportable', () => {
    expect(isReportAccount({ guid: 'a' } as Account)).toEqual(true);
    expect(isReportAccount({ guid: 'a', report: true } as Account)).toEqual(true);
    expect(isReportAccount({ guid: 'a', report: false } as Account)).toEqual(false);
  });
});
