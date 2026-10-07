import Money from '@/book/Money';
import getIncomeStatementTrees, { nonZeroLeaves } from '@/lib/reports/incomeStatement';
import type { Account } from '@/book/entities';

describe('getIncomeStatementTrees', () => {
  const eur = { mnemonic: 'EUR', namespace: 'CURRENCY' };
  const accounts = [
    {
      guid: 'root',
      name: 'Root',
      type: 'ROOT',
      childrenIds: ['income', 'expense'],
    },
    {
      guid: 'income',
      name: 'Income',
      type: 'INCOME',
      parentId: 'root',
      commodity: eur,
      childrenIds: ['salary'],
    },
    {
      guid: 'salary',
      name: 'Salary',
      type: 'INCOME',
      parentId: 'income',
      commodity: eur,
      childrenIds: [],
    },
    {
      guid: 'expense',
      name: 'Expenses',
      type: 'EXPENSE',
      parentId: 'root',
      commodity: eur,
      childrenIds: ['food', 'gifts', 'empty'],
    },
    {
      guid: 'food',
      name: 'Food',
      type: 'EXPENSE',
      parentId: 'expense',
      commodity: eur,
      childrenIds: [],
    },
    {
      guid: 'gifts',
      name: 'Gifts',
      type: 'EXPENSE',
      parentId: 'expense',
      commodity: eur,
      report: false,
      childrenIds: [],
    },
    {
      guid: 'empty',
      name: 'Empty',
      type: 'EXPENSE',
      parentId: 'expense',
      commodity: eur,
      childrenIds: [],
    },
  ] as unknown as Account[];

  it('builds trees excluding non report accounts', () => {
    const { expenses, income } = getIncomeStatementTrees({
      interval: TEST_INTERVAL,
      accounts,
      totals: {
        salary: new Money(-1000, 'EUR'),
        food: new Money(100, 'EUR'),
        gifts: new Money(50, 'EUR'),
      },
    });

    expect(income.total.toString()).toEqual('-1000 EUR');
    expect(income.leaves.map(l => l.account.guid)).toEqual(['salary']);

    expect(expenses.total.toString()).toEqual('100 EUR');
    expect(expenses.leaves.map(l => l.account.guid)).toEqual(['food', 'empty']);
    expect(nonZeroLeaves(expenses).map(l => l.account.guid)).toEqual(['food']);
  });
});
