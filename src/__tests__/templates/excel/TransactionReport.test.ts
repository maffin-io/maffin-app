import { DateTime } from 'luxon';
import writeXlsxFile from 'write-excel-file/browser';

import TransactionReportExcel from '@/templates/excel/TransactionReport';
import type { Account, Transaction } from '@/book/entities';

jest.mock('write-excel-file/browser', () => {
  const actual = jest.requireActual('write-excel-file/browser');
  return {
    __esModule: true,
    default: jest.fn(actual.default),
  };
});

const HEADER = ['Date', 'Description', 'Account', 'Amount', 'Currency'];

describe('TransactionReportExcel', () => {
  const eur = { mnemonic: 'EUR' };
  const root = { guid: 'root', name: 'Root', type: 'ROOT' } as Account;
  const expenseAccount = {
    guid: 'expense',
    name: 'Internet',
    path: 'Expenses:Utilities:Internet',
    type: 'EXPENSE',
    commodity: eur,
  } as Account;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes a section per type with its own header', async () => {
    const transactions = [
      {
        guid: 'tx1',
        date: DateTime.fromISO('2025-01-07'),
        description: 'Internet bill',
        currency: eur,
        splits: [
          { guid: 's1', quantity: 50.5, account: expenseAccount },
          { guid: 's2', value: 10, account: null },
        ],
      },
    ] as unknown as Transaction[];

    const blob = await TransactionReportExcel({
      interval: TEST_INTERVAL,
      transactions,
      accounts: [root, expenseAccount],
    });

    expect(blob).toBeInstanceOf(Blob);
    const [data, options] = (writeXlsxFile as jest.Mock).mock.calls[0];
    expect(options).toEqual(expect.objectContaining({ sheet: 'Transactions' }));

    expect(data[0]).toEqual([{ value: 'Expenses', fontWeight: 'bold', fontSize: 14 }]);
    expect(data[1].map((cell: { value: string }) => cell.value)).toEqual(HEADER);
    expect(data[2]).toEqual([
      { value: new Date(Date.UTC(2025, 0, 7)), type: Date, format: 'dd/mm/yyyy' },
      'Internet bill',
      'Utilities:Internet',
      { value: 50.5, type: Number, format: '#,##0.00' },
      'EUR',
    ]);
    expect(data[3]).toEqual([]);

    expect(data[4][0].value).toEqual('Income');
    expect(data[5].map((cell: { value: string }) => cell.value)).toEqual(HEADER);
    expect(data[6]).toEqual(['No transactions']);
    expect(data[7]).toEqual([]);

    expect(data[8][0].value).toEqual('Orphan');
    expect(data[10][2]).toEqual('Orphan');
    expect(data).toHaveLength(11);
  });

  it('omits the orphan section when there are no orphans', async () => {
    await TransactionReportExcel({
      interval: TEST_INTERVAL,
      transactions: [],
      accounts: [root],
    });

    const [data] = (writeXlsxFile as jest.Mock).mock.calls[0];
    expect(data.map((row: { value?: string }[]) => row[0]?.value)).toEqual(
      ['Expenses', 'Date', undefined, undefined, 'Income', 'Date', undefined],
    );
  });
});
