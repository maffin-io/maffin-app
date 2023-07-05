import { DateTime } from 'luxon';
import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource } from 'typeorm';
import crypto from 'crypto';

import Stocker from '@/apis/Stocker';
import * as dataSourceHooks from '@/hooks/useDataSource';
import * as queries from '@/book/queries';
import * as transactionLib from '@/book/lib/transaction';
import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import TransactionForm from '@/components/forms/transaction/TransactionForm';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/book/lib/transaction', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/lib/transaction'),
}));

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

describe('TransactionForm', () => {
  let eur: Commodity;
  let root: Account;
  let datasource: DataSource;
  let assetAccount: Account;
  let expenseAccount: Account;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Price, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({
      guid: 'eur_guid',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    root = await Account.create({
      guid: 'root_account_guid',
      name: 'Root account',
      type: 'ROOT',
    }).save();

    assetAccount = await Account.create({
      guid: 'account_guid_1',
      name: 'bank',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    expenseAccount = await Account.create({
      guid: 'account_guid_2',
      name: 'Expense',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();

    assetAccount.path = 'Assets:bank';
    expenseAccount.path = 'Expenses:Expense1';

    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      assetAccount, expenseAccount,
    ]);

    jest.spyOn(transactionLib, 'createTransaction').mockImplementation(async () => {});
    jest.spyOn(Stocker.prototype, 'getPrice').mockResolvedValue({
      price: 0.987,
      currency: 'USD',
    });
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <TransactionForm
        onSave={() => {}}
        account={assetAccount}
      />,
    );

    expect(screen.getByLabelText('Date')).not.toBeNull();
    expect(screen.getByLabelText('Description')).not.toBeNull();
    expect(screen.getByText('Entries')).not.toBeNull();
    expect(screen.getByText('Add split')).not.toBeNull();
    expect(screen.getByText('Save')).not.toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('can add split', async () => {
    const user = userEvent.setup();
    render(<TransactionForm
      onSave={() => {}}
      account={assetAccount}
    />);

    await user.click(screen.getByText('Add split'));
    expect(screen.queryAllByRole('combobox')).toHaveLength(2);
    expect(screen.queryAllByRole('button', { name: 'X' })).toHaveLength(2);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(2);
  });

  it('shows error when date is empty', async () => {
    const user = userEvent.setup();
    render(<TransactionForm
      onSave={() => {}}
      account={assetAccount}
    />);

    await user.click(screen.getByText('Save'));
    expect(screen.getByText('Date is required')).not.toBeNull();
  });

  it('shows error when description is empty', async () => {
    const user = userEvent.setup();
    render(<TransactionForm
      onSave={() => {}}
      account={assetAccount}
    />);

    await user.click(screen.getByText('Save'));
    screen.getByText('Description is required');
  });

  it('calls createTransaction with expected data for single split', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    const mockSave = jest.fn();
    const user = userEvent.setup();
    render(<TransactionForm
      onSave={mockSave}
      account={assetAccount}
    />);

    await user.type(screen.getByRole('textbox', { name: /description/i }), 'My expense');
    await user.type(screen.getByLabelText('Date'), '2023-01-01');

    await userEvent.click(screen.getByLabelText('splits.0.toAccount'));
    await user.click(screen.getByText(/expenses:expense1/i));

    await user.type(screen.getByRole('spinbutton'), '100');

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(transactionLib.createTransaction).toHaveBeenCalledWith(
      DateTime.fromISO('2023-01-01'),
      'My expense',
      {
        action: '',
        guid: expect.any(String),
        fk_account: assetAccount,
        quantityDenom: 1,
        quantityNum: -100,
        valueDenom: 1,
        valueNum: -100,
      },
      [
        {
          action: '',
          guid: expect.any(String),
          fk_account: expenseAccount,
          quantityDenom: 1,
          quantityNum: 100,
          valueDenom: 1,
          valueNum: 100,
        },
      ],
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('calls createTransaction with expected data for different currency', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    const usd = await Commodity.create({
      guid: 'usd_guid',
      namespace: 'CURRENCY',
      mnemonic: 'USD',
    }).save();
    assetAccount.fk_commodity = usd;
    await assetAccount.save();

    const mockSave = jest.fn();
    const user = userEvent.setup();
    render(<TransactionForm
      onSave={mockSave}
      account={assetAccount}
    />);

    await user.type(screen.getByRole('textbox', { name: /description/i }), 'My expense');
    await user.type(screen.getByLabelText('Date'), '2023-01-01');

    await userEvent.click(screen.getByLabelText('splits.0.toAccount'));
    await user.click(screen.getByText(/expenses:expense1/i));

    await user.type(screen.getByPlaceholderText('0.0'), '100');
    await user.clear(screen.getByPlaceholderText('$ -> €'));
    await user.type(screen.getByPlaceholderText('$ -> €'), '0.987');

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(transactionLib.createTransaction).toHaveBeenCalledWith(
      DateTime.fromISO('2023-01-01'),
      'My expense',
      {
        action: '',
        guid: expect.any(String),
        fk_account: assetAccount,
        quantityDenom: 1,
        quantityNum: -100,
        valueDenom: 1,
        valueNum: -100,
      },
      [
        {
          action: '',
          guid: expect.any(String),
          fk_account: expenseAccount,
          quantityDenom: 10,
          quantityNum: 987,
          valueDenom: 1,
          valueNum: 100,
        },
      ],
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('calls createTransaction with expected data with multiple splits', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    const expenseAccount2 = await Account.create({
      guid: 'account_guid_3',
      name: 'Expense2',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();
    expenseAccount2.path = 'Expenses:Expense2';

    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      assetAccount, expenseAccount, expenseAccount2,
    ]);

    const mockSave = jest.fn();
    const user = userEvent.setup();
    render(<TransactionForm
      onSave={mockSave}
      account={assetAccount}
    />);

    await user.type(screen.getByRole('textbox', { name: /description/i }), 'My expense');
    await user.type(screen.getByLabelText('Date'), '2023-01-01');

    await user.click(screen.getByText('Add split'));
    const amountInputs = screen.getAllByPlaceholderText('0.0');

    await userEvent.click(screen.getByLabelText('splits.0.toAccount'));
    await user.click(screen.getByText(/expenses:expense1/i));
    await user.type(amountInputs[0], '100');

    await userEvent.click(screen.getByLabelText('splits.1.toAccount'));
    await user.click(screen.getByText(/expenses:expense2/i));
    await user.type(amountInputs[1], '50');

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(transactionLib.createTransaction).toHaveBeenCalledWith(
      DateTime.fromISO('2023-01-01'),
      'My expense',
      {
        action: '',
        guid: expect.any(String),
        fk_account: assetAccount,
        quantityDenom: 1,
        quantityNum: -150,
        valueDenom: 1,
        valueNum: -150,
      },
      [
        {
          action: '',
          guid: expect.any(String),
          fk_account: expenseAccount,
          quantityDenom: 1,
          quantityNum: 100,
          valueDenom: 1,
          valueNum: 100,
        },
        {
          action: '',
          guid: expect.any(String),
          fk_account: expenseAccount2,
          quantityDenom: 1,
          quantityNum: 50,
          valueDenom: 1,
          valueNum: 50,
        },
      ],
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});
