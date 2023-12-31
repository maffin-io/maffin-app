import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource } from 'typeorm';
import * as swr from 'swr';
import type { SWRResponse } from 'swr';
import { useRouter } from 'next/navigation';

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
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2023-01-30'));
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

  it('renders as expected with add', async () => {
    const { container } = render(
      <AccountForm
        action="add"
        onSave={() => {}}
      />,
    );

    await screen.findByLabelText('Name');
    screen.getByRole('combobox', { name: 'parentInput' });
    screen.getByRole('combobox', { name: 'commodityInput' });
    expect(screen.getByLabelText('typeInput')).toBeDisabled();
    screen.getByRole('spinbutton', { name: 'Opening balance', hidden: true });
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with update', async () => {
    const { container } = render(
      <AccountForm
        action="update"
        onSave={() => {}}
      />,
    );

    await screen.findByLabelText('Name');
    screen.getByRole('combobox', { name: 'parentInput' });
    expect(screen.getByLabelText('typeInput')).toBeDisabled();
    expect(screen.getByLabelText('commodityInput')).toBeDisabled();
    screen.getByRole('spinbutton', { name: 'Opening balance', hidden: true });
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with delete', async () => {
    const { container } = render(
      <AccountForm
        action="delete"
        onSave={() => {}}
      />,
    );

    await screen.findByLabelText('Name');
    expect(screen.getByLabelText('parentInput')).toBeDisabled();
    expect(screen.getByLabelText('typeInput')).toBeDisabled();
    expect(screen.getByLabelText('commodityInput')).toBeDisabled();
    screen.getByRole('spinbutton', { name: 'Opening balance', hidden: true });
    expect(container).toMatchSnapshot();
  });

  it('renders with defaults as expected', async () => {
    render(
      <AccountForm
        defaultValues={{
          name: 'Test account',
          parent: assetAccount,
          type: 'BANK',
          fk_commodity: eur,
        }}
        onSave={() => {}}
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Test account'));
    screen.getByText('Assets');
    screen.getByText('BANK');
    screen.getByText('EUR');
  });

  it('doesnt show defaults when specified', async () => {
    render(
      <AccountForm
        defaultValues={{
          name: 'Test account',
          parent: assetAccount,
          type: 'BANK',
          fk_commodity: eur,
        }}
        hideDefaults
        onSave={() => {}}
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Test account'));

    const fieldsets = screen.getAllByRole('group');
    // Can't check with toBeVisible due tailwindcss not being understood by jest
    expect(fieldsets[2]).toHaveClass('hidden');
    expect(fieldsets[3]).toHaveClass('hidden');
    expect(fieldsets[5]).toHaveClass('hidden');
  });

  it('button is disabled when form not valid', async () => {
    const user = userEvent.setup();
    render(
      <AccountForm
        onSave={() => {}}
      />,
    );

    await user.type(screen.getByLabelText('Name'), 'ha');

    const button = await screen.findByText('add');
    await user.click(button);
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

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

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
      placeholder: false,
      hidden: false,
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(swr.mutate).toBeCalledTimes(1);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, '/api/accounts');
  });

  it('updates account', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();

    const account = await Account.findOneOrFail({
      where: { name: 'Assets' },
      relations: { parent: true },
    });

    render(
      <AccountForm
        action="update"
        onSave={mockSave}
        defaultValues={{
          ...account,
        }}
      />,
    );

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'New name');

    expect(screen.getByText('update')).not.toBeDisabled();
    await user.click(screen.getByText('update'));
    const accounts = await Account.find();

    expect(accounts).toHaveLength(3);
    expect(accounts[1]).toMatchObject({
      guid: assetAccount.guid,
      name: 'New name',
      path: 'New name',
    });
  });

  it('deletes account', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();

    const mockRouterReplace = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      replace: mockRouterReplace,
    }));

    const account = await Account.findOneOrFail({
      where: { name: 'Assets' },
      relations: { parent: true },
    });

    render(
      <AccountForm
        action="delete"
        onSave={mockSave}
        defaultValues={{
          ...account,
        }}
      />,
    );

    const deleteButton = await screen.findByText('delete');

    expect(deleteButton).not.toBeDisabled();
    await user.click(deleteButton);
    const accounts = await Account.find();

    expect(accounts).toHaveLength(2);
    expect(account.guid in accounts).toBe(false);
    expect(mockRouterReplace).toBeCalledWith('/dashboard/accounts');
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

    await user.type(screen.getByLabelText('Opening balance'), '1000.10');
    await user.clear(screen.getByLabelText('When'));
    await user.type(screen.getByLabelText('When'), '2023-01-01');

    await user.click(screen.getByRole('combobox', { name: 'commodityInput' }));
    await user.click(screen.getByText('EUR'));

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

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
      placeholder: false,
      hidden: false,
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
        quantityDenom: 10,
        quantityNum: 10001,
        valueDenom: 10,
        valueNum: 10001,
      },
      {
        accountId: equity.guid,
        action: '',
        guid: expect.any(String),
        quantityDenom: 10,
        quantityNum: -10001,
        valueDenom: 10,
        valueNum: -10001,
      },
    ]);

    expect(swr.mutate).toBeCalledTimes(4);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, '/api/accounts');
    expect(swr.mutate).toHaveBeenNthCalledWith(2, '/api/accounts', expect.any(Function), { revalidate: false });
    expect(swr.mutate).toHaveBeenNthCalledWith(3, '/api/monthly-totals', undefined);
    expect(swr.mutate).toHaveBeenNthCalledWith(4, '/api/txs/latest', undefined);
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
