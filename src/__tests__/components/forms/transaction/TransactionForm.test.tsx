import { DateTime } from 'luxon';
import React from 'react';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource } from 'typeorm';
import crypto from 'crypto';

import Stocker from '@/apis/Stocker';
import * as dataSourceHooks from '@/hooks/useDataSource';
import * as queries from '@/book/queries';
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

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe('TransactionForm', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let sgd: Commodity;
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

    sgd = await Commodity.create({
      guid: 'sgd_guid',
      namespace: 'CURRENCY',
      mnemonic: 'SGD',
    }).save();

    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(eur);

    const root = await Account.create({
      guid: 'root_account_guid',
      name: 'Root',
      type: 'ROOT',
    }).save();

    assetAccount = await Account.create({
      guid: 'account_guid_1',
      name: 'Asset1',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    expenseAccount = await Account.create({
      guid: 'account_guid_2',
      name: 'Random',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();

    assetAccount.path = 'Assets:asset1';
    expenseAccount.path = 'Expenses:random';
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

    await waitFor(() => {
      // wait for initial validation to appear
      screen.queryByText('account is required');
    });

    screen.getByLabelText('Date');
    screen.getByLabelText('Description');
    screen.getByRole('combobox', { name: 'splits.0.account' });
    screen.getByRole('combobox', { name: 'splits.1.account' });
    expect(screen.getByText('Save')).toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('creates transaction with expected params when both same currency', async () => {
    const user = userEvent.setup();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      assetAccount, expenseAccount,
    ]);
    const mockSave = jest.fn();

    render(
      <TransactionForm
        onSave={mockSave}
        account={assetAccount}
      />,
    );

    await waitFor(() => {
      // wait for initial validation to appear
      screen.queryByText('account is required');
    });

    const [q0, q1] = screen.getAllByRole('spinbutton');
    expect(q0).toBeDisabled();
    expect(q1).toBeDisabled();

    await user.type(screen.getByLabelText('Date'), '2023-01-01');
    await user.type(screen.getByLabelText('Description'), 'My expense');

    await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
    await user.click(screen.getByText('Expenses:random'));

    expect(q0).toBeEnabled();
    expect(q1).toBeEnabled();
    // This happens in the UI too, we have to press - twice and dont know why
    await user.type(q0, '--100');
    await waitFor(() => expect(q0).toHaveValue(-100));
    await waitFor(() => expect(q1).toHaveValue(100));

    expect(screen.getByText('Save')).not.toBeDisabled();
    await user.click(screen.getByText('Save'));

    const tx = await Transaction.findOneOrFail({
      where: { description: 'My expense' },
      relations: {
        splits: {
          fk_account: true,
        },
      },
    });

    expect(tx).toMatchObject({
      guid: expect.any(String),
      date: DateTime.fromISO('2023-01-01'),
      description: 'My expense',
      fk_currency: eur,
      splits: [
        {
          guid: expect.any(String),
          action: '',
          fk_account: {
            guid: 'account_guid_1',
          },
          quantityNum: -100,
          quantityDenom: 1,
          valueNum: -100,
          valueDenom: 1,
        },
        {
          guid: expect.any(String),
          action: '',
          fk_account: {
            guid: 'account_guid_2',
          },
          quantityNum: 100,
          quantityDenom: 1,
          valueNum: 100,
          valueDenom: 1,
        },
      ],
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('creates transaction with expected params with different currency', async () => {
    const user = userEvent.setup();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 0.7, currency: '' });
    assetAccount.fk_commodity = sgd;
    await assetAccount.save();
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      assetAccount, expenseAccount,
    ]);
    const mockSave = jest.fn();

    render(
      <TransactionForm
        onSave={mockSave}
        account={assetAccount}
      />,
    );

    await waitFor(() => {
      // wait for initial validation to appear
      screen.queryByText('account is required');
    });

    const [q0, q1] = screen.getAllByRole('spinbutton');
    expect(q0).toBeDisabled();
    expect(q1).toBeDisabled();

    await user.type(screen.getByLabelText('Date'), '2023-01-01');
    await user.type(screen.getByLabelText('Description'), 'My expense');

    await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
    await user.click(screen.getByText('Expenses:random'));

    expect(q0).toBeEnabled();
    expect(q1).toBeEnabled();
    // This happens in the UI too, we have to press - twice and dont know why
    await user.type(q0, '--100');

    const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });
    await waitFor(() => expect(v0).toHaveValue(-70));
    await waitFor(() => expect(q0).toHaveValue(-100));

    await user.type(q1, '70');
    await waitFor(() => expect(q1).toHaveValue(70));
    const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });
    await waitFor(() => expect(v1).toHaveValue(70));

    expect(screen.getByText('Save')).not.toBeDisabled();
    await user.click(screen.getByText('Save'));

    const tx = await Transaction.findOneOrFail({
      where: { description: 'My expense' },
      relations: {
        splits: {
          fk_account: true,
        },
      },
    });

    expect(tx).toMatchObject({
      guid: expect.any(String),
      date: DateTime.fromISO('2023-01-01'),
      description: 'My expense',
      fk_currency: eur,
      splits: [
        {
          guid: expect.any(String),
          action: '',
          fk_account: {
            guid: 'account_guid_1',
          },
          quantityNum: -100,
          quantityDenom: 1,
          valueNum: -70,
          valueDenom: 1,
        },
        {
          guid: expect.any(String),
          action: '',
          fk_account: {
            guid: 'account_guid_2',
          },
          quantityNum: 70,
          quantityDenom: 1,
          valueNum: 70,
          valueDenom: 1,
        },
      ],
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});
