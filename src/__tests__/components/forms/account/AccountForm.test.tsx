import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource } from 'typeorm';
import { SWRConfig } from 'swr';

import { getAllowedSubAccounts } from '@/book/helpers/accountType';
import * as queries from '@/book/queries';
import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import AccountForm from '@/components/forms/account/AccountForm';

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
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

    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      root, assetAccount, expenseAccount,
    ]);
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountForm
          onSave={() => {}}
        />
      </SWRConfig>,
    );

    await screen.findByLabelText('Name');
    expect(screen.getByRole('combobox', { name: 'parentInput' })).not.toBeNull();
    expect(screen.queryByRole('combobox', { name: 'typeInput' })).toBeNull();
    expect(screen.getByRole('combobox', { name: 'commodityInput' })).not.toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('button is disabled when form not valid', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountForm
          onSave={() => {}}
        />
      </SWRConfig>,
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

    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      root, assetAccount, expenseAccount, stockAccount, mutualAccount,
    ]);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountForm
          onSave={() => {}}
        />
      </SWRConfig>,
    );

    await user.click(screen.getByRole('combobox', { name: 'parentInput' }));
    screen.getByText('Assets');
    screen.getByText('Expenses');
    expect(screen.queryByText('Stock')).toBeNull();
    expect(screen.queryByText('Mutual')).toBeNull();
  });

  it('creates account with expected params', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountForm
          onSave={mockSave}
        />
      </SWRConfig>,
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
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
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

    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      root, assetAccount, expenseAccount, incomeAccount, bankAccount,
    ]);

    const user = userEvent.setup();
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountForm
          onSave={() => {}}
        />
      </SWRConfig>,
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
