import reportAccountGuids, {
  reportChildIds,
  totalsChildIds,
  isReportAccount,
  isVisibleInAccountsTree,
} from '@/helpers/visibleAccountGuids';
import type { Account } from '@/book/entities';
import mapAccounts from '@/helpers/mapAccounts';

describe('report account helpers', () => {
  const accounts = [
    {
      guid: 'root',
      name: 'Root',
      type: 'ROOT',
      childrenIds: ['income', 'expense', 'asset', 'hidden-asset', 'no-report-ie', 'no-report-asset'],
    } as Account,
    {
      guid: 'income',
      name: 'Salary',
      type: 'INCOME',
      parentId: 'root',
      childrenIds: [],
    } as Account,
    {
      guid: 'expense',
      name: 'Food',
      type: 'EXPENSE',
      parentId: 'root',
      childrenIds: [],
      hidden: true,
    } as Account,
    {
      guid: 'asset',
      name: 'Bank',
      type: 'ASSET',
      parentId: 'root',
      childrenIds: [],
    } as Account,
    {
      guid: 'hidden-asset',
      name: 'Old bank',
      type: 'ASSET',
      parentId: 'root',
      childrenIds: [],
      hidden: true,
    } as Account,
    {
      guid: 'no-report-ie',
      name: 'Private income',
      type: 'INCOME',
      parentId: 'root',
      childrenIds: [],
      report: false,
    } as Account,
    {
      guid: 'no-report-asset',
      name: 'Static asset',
      type: 'ASSET',
      parentId: 'root',
      childrenIds: [],
      report: false,
    } as Account,
  ];

  it('returns PDF reportable child ids', () => {
    const accountsMap = mapAccounts(accounts);

    expect(reportChildIds(accountsMap, accountsMap.root)).toEqual([
      'income',
      'expense',
      'asset',
      'hidden-asset',
    ]);
  });

  it('returns totals child ids with IE always included', () => {
    const accountsMap = mapAccounts(accounts);

    expect(totalsChildIds(accountsMap, accountsMap.root)).toEqual([
      'income',
      'expense',
      'asset',
      'hidden-asset',
      'no-report-ie',
    ]);
  });

  it('treats missing report flag as reportable', () => {
    expect(isReportAccount({ guid: 'a' } as Account)).toEqual(true);
    expect(isReportAccount({ guid: 'a', report: true } as Account)).toEqual(true);
    expect(isReportAccount({ guid: 'a', report: false } as Account)).toEqual(false);
  });

  it('hides hidden accounts and non-report assets from the tree', () => {
    const accountsMap = mapAccounts(accounts);

    expect(isVisibleInAccountsTree(accountsMap.income)).toEqual(true);
    expect(isVisibleInAccountsTree(accountsMap.expense)).toEqual(false);
    expect(isVisibleInAccountsTree(accountsMap['no-report-ie'])).toEqual(true);
    expect(isVisibleInAccountsTree(accountsMap.asset)).toEqual(true);
    expect(isVisibleInAccountsTree(accountsMap['hidden-asset'])).toEqual(false);
    expect(isVisibleInAccountsTree(accountsMap['no-report-asset'])).toEqual(false);
  });

  it('filters chart guids for non-report assets only', () => {
    expect(reportAccountGuids(
      ['income', 'no-report-ie', 'asset', 'no-report-asset'],
      accounts,
    )).toEqual(['income', 'no-report-ie', 'asset']);
  });

  it('includes explicitly requested non-report asset guids', () => {
    expect(reportAccountGuids(
      ['no-report-asset'],
      accounts,
      ['no-report-asset'],
    )).toEqual(['no-report-asset']);
  });
});
