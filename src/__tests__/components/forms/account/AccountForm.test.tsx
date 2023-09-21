import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource } from 'typeorm';
import * as swr from 'swr';
import type { SWRResponse } from 'swr';

import { getAllowedSubAccounts } from '@/book/helpers/accountType';
import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import AccountForm from '@/components/forms/account/AccountForm';
import * as apiHook from '@/hooks/api';

jest.mock('swr');

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('AccountForm', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let root: Account;
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
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();

    assetAccount = await Account.create({
      name: 'Assets',
      type: 'ASSET',
      fk_commodity: eur,
      parent: root,
    }).save();

    expenseAccount = await Account.create({
      name: 'Expenses',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();

    root.path = 'Root';
    assetAccount.path = 'Assets';
    expenseAccount.path = 'Expenses';

    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: [eur] } as SWRResponse);
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: [root, assetAccount, expenseAccount] } as SWRResponse);
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <AccountForm
        onSave={() => {}}
      />,
    );

    await screen.findByLabelText('Name');
    screen.getByRole('combobox', { name: 'parentInput' });
    expect(screen.getByRole('combobox', { name: '', hidden: true })).toBeDisabled();
    screen.getByRole('spinbutton', { name: 'Opening balance', hidden: true });
    screen.getByRole('spinbutton', { name: 'When', hidden: true });
    screen.getByRole('combobox', { name: 'commodityInput' });
    expect(container).toMatchSnapshot();
  });

  it('button is disabled when form not valid', async () => {
    render(
      <AccountForm
        onSave={() => {}}
      />,
    );

    const button = await screen.findByText('Save');
    expect(button).toBeDisabled();
  });

  /**
   * STOCK/MUTUAL accounts can't have children
   */
  it('filters stock/mutual accounts as parents', async () => {
    const user = userEvent.setup();
    const commodity = await Commodity.create({
      mnemonic: 'STOCK',
      namespace: 'NASDAQ',
    }).save();

    const stockAccount = await Account.create({
      guid: 'stock_guid_1',
      name: 'Stock',
      type: 'STOCK',
      fk_commodity: commodity,
      parent: assetAccount,
    }).save();

    const mutualAccount = await Account.create({
      guid: 'mutual_guid_1',
      name: 'Fund',
      type: 'MUTUAL',
      fk_commodity: commodity,
      parent: assetAccount,
    }).save();

    stockAccount.path = 'Assets:Stock';
    mutualAccount.path = 'Assets:Mutual';

    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      { data: [root, assetAccount, expenseAccount, stockAccount, mutualAccount] } as SWRResponse,
    );

    render(
      <AccountForm
        onSave={() => {}}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'parentInput' }));
    screen.getByText('Assets');
    screen.getByText('Expenses');
    expect(screen.queryByText('Stock')).toBeNull();
    expect(screen.queryByText('Mutual')).toBeNull();
  });

  it('creates account with expected params, mutates and saves', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();

    render(
      <AccountForm
        onSave={mockSave}
      />,
    );

    await user.type(screen.getByLabelText('Name'), 'TestAccount');

    await user.click(screen.getByRole('combobox', { name: 'parentInput' }));
    await user.click(screen.getByText('Assets'));

    await user.click(screen.getByRole('combobox', { name: 'typeInput' }));
    await user.click(screen.getByText('ASSET'));

    await user.click(screen.getByRole('combobox', { name: 'commodityInput' }));
    await user.click(screen.getByText('EUR'));

    expect(screen.getByText('Save')).not.toBeDisabled();
    await user.click(screen.getByText('Save'));

    const account = await Account.findOneByOrFail({ name: 'TestAccount' });
    expect(account).toEqual({
      guid: expect.any(String),
      name: 'TestAccount',
      type: 'ASSET',
      fk_commodity: eur,
      childrenIds: [],
      description: null,
      parentId: assetAccount.guid,
      path: 'Assets:TestAccount',
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(swr.mutate).toBeCalledTimes(1);
    expect(swr.mutate).toHaveBeenNthCalledWith(
      1,
      '/api/accounts',
      expect.any(Function),
      { revalidate: false },
    );

    expect(
      await (swr.mutate as jest.Mock).mock.calls[0][1]({
        [assetAccount.guid]: Account,
      }),
    ).toEqual({
      [assetAccount.guid]: await Account.findOneByOrFail({ guid: assetAccount.guid }),
      [account.guid]: account,
    });
  });

  it('creates bank account with opening balance', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();

    render(
      <AccountForm
        onSave={mockSave}
      />,
    );

    await user.type(screen.getByLabelText('Name'), 'TestAccount');

    await user.click(screen.getByRole('combobox', { name: 'parentInput' }));
    await user.click(screen.getByText('Assets'));

    await user.click(screen.getByRole('combobox', { name: 'typeInput' }));
    await user.click(screen.getByText('BANK'));

    await user.type(screen.getByLabelText('Opening balance'), '1000');
    await user.clear(screen.getByLabelText('When'));
    await user.type(screen.getByLabelText('When'), '2023-01-01');

    await user.click(screen.getByRole('combobox', { name: 'commodityInput' }));
    await user.click(screen.getByText('EUR'));

    expect(screen.getByText('Save')).not.toBeDisabled();
    await user.click(screen.getByText('Save'));

    const account = await Account.findOneByOrFail({ name: 'TestAccount' });
    expect(account).toEqual({
      guid: expect.any(String),
      name: 'TestAccount',
      type: 'BANK',
      fk_commodity: eur,
      childrenIds: [],
      description: null,
      parentId: assetAccount.guid,
      path: 'Assets:TestAccount',
    });

    const txs = await Transaction.find();
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({
      guid: expect.any(String),
      description: 'Opening balance',
      fk_currency: {
        mnemonic: 'EUR',
      },
      date: DateTime.fromISO('2023-01-01'),
    });

    const equity = await Account.findOneByOrFail({ name: 'Opening balances - EUR' });
    const splits = await Split.find();
    expect(splits).toEqual([
      {
        accountId: account.guid,
        action: '',
        guid: expect.any(String),
        quantityDenom: 1,
        quantityNum: 1000,
        valueDenom: 1,
        valueNum: 1000,
      },
      {
        accountId: equity.guid,
        action: '',
        guid: expect.any(String),
        quantityDenom: 1,
        quantityNum: -1000,
        valueDenom: 1,
        valueNum: -1000,
      },
    ]);
  });

  it.each([
    ['EXPENSE', 'Expenses'],
    ['INCOME', 'Income'],
    ['ASSET', 'Assets'],
    ['BANK', 'Assets:Bank'],
    ['ROOT', 'Root'],
  ])('filters selection for account type with %s parent', async (parentType, parentName) => {
    const incomeAccount = await Account.create({
      guid: 'income_guid_1',
      name: 'Income',
      type: 'INCOME',
      fk_commodity: eur,
      parent: root,
    }).save();
    incomeAccount.path = 'Income';

    const bankAccount = await Account.create({
      guid: 'bank_guid_1',
      name: 'Bank',
      type: 'BANK',
      fk_commodity: eur,
      parent: assetAccount,
    }).save();
    bankAccount.path = 'Assets:Bank';

    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      { data: [root, assetAccount, expenseAccount, incomeAccount, bankAccount] } as SWRResponse,
    );

    const user = userEvent.setup();
    render(
      <AccountForm
        onSave={() => {}}
      />,
    );

    await user.type(screen.getByLabelText('Name'), 'My account');

    await user.click(screen.getByRole('combobox', { name: 'parentInput' }));
    await user.click(screen.getByText(parentName));

    const typeInput = await screen.findByRole('combobox', { name: 'typeInput' });
    await user.click(typeInput);

    const allowedTypes = getAllowedSubAccounts(parentType);
    const ignoredTypes = allowedTypes.filter(type => !allowedTypes.includes(type));

    allowedTypes.forEach(type => screen.getByText(type));
    ignoredTypes.forEach(type => expect(screen.queryByText(type)).toBeNull());
  });
});
