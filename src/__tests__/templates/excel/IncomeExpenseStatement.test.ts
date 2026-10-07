import writeXlsxFile from 'write-excel-file/browser';

import Money from '@/book/Money';
import IncomeExpenseStatementExcel from '@/templates/excel/IncomeExpenseStatement';
import type { Account } from '@/book/entities';

jest.mock('write-excel-file/browser', () => {
  const actual = jest.requireActual('write-excel-file/browser');
  return {
    __esModule: true,
    default: jest.fn(actual.default),
  };
});

describe('IncomeExpenseStatementExcel', () => {
  it('writes the income and expense trees with indentation', async () => {
    const eur = { mnemonic: 'EUR', namespace: 'CURRENCY' };
    const accounts = [
      {
        guid: 'root', name: 'Root', type: 'ROOT', childrenIds: ['income', 'expense'],
      },
      {
        guid: 'income', name: 'Income', type: 'INCOME', parentId: 'root', commodity: eur, childrenIds: ['salary'],
      },
      {
        guid: 'salary', name: 'Salary', type: 'INCOME', parentId: 'income', commodity: eur, childrenIds: [],
      },
      {
        guid: 'expense', name: 'Expenses', type: 'EXPENSE', parentId: 'root', commodity: eur, childrenIds: ['food', 'empty'],
      },
      {
        guid: 'food', name: 'Food', type: 'EXPENSE', parentId: 'expense', commodity: eur, childrenIds: [],
      },
      {
        guid: 'empty', name: 'Empty', type: 'EXPENSE', parentId: 'expense', commodity: eur, childrenIds: [],
      },
    ] as unknown as Account[];

    const blob = await IncomeExpenseStatementExcel({
      interval: TEST_INTERVAL,
      accounts,
      totals: {
        salary: new Money(-1000, 'EUR'),
        food: new Money(100, 'EUR'),
      },
    });

    expect(blob).toBeInstanceOf(Blob);
    const [data, options] = (writeXlsxFile as jest.Mock).mock.calls[0];
    expect(options).toEqual(expect.objectContaining({ sheet: 'Income statement' }));
    expect(data[0][0].value).toEqual(`Income statement ${TEST_INTERVAL.toISODate()}`);
    expect(data[2].map((cell: { value: string }) => cell.value)).toEqual(['Account', 'Total', 'Currency']);
    expect(data[3]).toEqual([
      { value: 'Expenses', indent: 0, fontWeight: 'bold' },
      {
        value: 100, type: Number, format: '#,##0.00', fontWeight: 'bold',
      },
      'EUR',
    ]);
    expect(data[4]).toEqual([
      { value: 'Food', indent: 1 },
      { value: 100, type: Number, format: '#,##0.00' },
      'EUR',
    ]);
    expect(data[5]).toEqual([]);
    expect(data[6][0]).toEqual({ value: 'Income', indent: 0, fontWeight: 'bold' });
    expect(data[7][0]).toEqual({ value: 'Salary', indent: 1 });
    expect(data[7][1].value).toEqual(-1000);
    expect(data).toHaveLength(8);
  });
});
