import React from 'react';
import { screen, render } from '@testing-library/react';
import { DataSource } from 'typeorm';
import type { SWRResponse } from 'swr';
import { DateTime } from 'luxon';
import userEvent from '@testing-library/user-event';

import Onboarding from '@/components/onboarding/Onboarding';
import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import * as API from '@/hooks/api';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('Onboarding', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Price, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    await Account.create({
      guid: 'root_account_guid',
      name: 'Root',
      type: 'ROOT',
    }).save();

    jest.spyOn(API, 'useAccounts').mockReturnValue({ data: undefined } as SWRResponse);
  });

  // This test is huge but doing it like this because the onboarding
  // steps are linked one after the other
  it('full onboarding', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <span id="add-account" />
        <span id="accounts-table" />
        <Onboarding show />
      </div>,
    );

    // STEP 1
    // Select main currency and create initial accounts
    await screen.findByText('Welcome!', { exact: false });

    await user.click(screen.getByRole('combobox', { name: 'mnemonicInput' }));
    await user.click(screen.getByText('EUR'));

    await user.click(screen.getByText('Save'));

    const eur = await Commodity.findOneByOrFail({ mnemonic: 'EUR' });

    const accounts = await Account.find();
    expect(accounts).toEqual([
      expect.objectContaining({
        name: 'Root',
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: 'root_account_guid',
        placeholder: true,
        type: 'ASSET',
        name: 'Assets',
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: 'root_account_guid',
        placeholder: true,
        type: 'EXPENSE',
        name: 'Expenses',
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: 'root_account_guid',
        placeholder: true,
        type: 'LIABILITY',
        name: 'Liabilities',
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: 'root_account_guid',
        placeholder: true,
        type: 'INCOME',
        name: 'Income',
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: 'root_account_guid',
        placeholder: true,
        type: 'EQUITY',
        name: 'Equity',
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: accounts[5].guid,
        placeholder: false,
        type: 'EQUITY',
        name: 'Opening balances - EUR',
      }),
    ]);

    // STEP 2
    // Adds a bank account, all data is prefilled except the opening balance
    await screen.findByText('Let\'s add your first', { exact: false });
    await screen.findByText('Assets');
    await user.type(screen.getByLabelText('Opening balance'), '1000');

    expect(screen.getByText('Save')).toBeEnabled();
    await user.click(screen.getByText('Save'));
    const bankAccount = await Account.findOneByOrFail({ name: 'My bank account' });
    expect(bankAccount).toEqual(expect.objectContaining({
      fk_commodity: eur,
      placeholder: false,
      type: 'BANK',
      name: 'My bank account',
      parentId: accounts[1].guid,
    }));

    // STEP 3
    // Show accounts tree
    await screen.findByText('This represents your accounts tree', { exact: false });
    await user.click(screen.getByText('Next'));

    // STEP 4
    // Adds an expense account
    await screen.findByText('account to track your expenses', { exact: false });
    await screen.findByText('Expenses');

    expect(screen.getByText('Save')).toBeEnabled();
    await user.click(screen.getByText('Save'));
    const expensesAccount = await Account.findOneByOrFail({ name: 'Groceries' });
    expect(expensesAccount).toEqual(expect.objectContaining({
      fk_commodity: eur,
      placeholder: false,
      type: 'EXPENSE',
      name: 'Groceries',
      parentId: accounts[2].guid,
    }));

    // STEP 5
    // Adds a transaction between bank account and groceries account
    await screen.findByText('add the first transaction', { exact: false });
    await user.type(screen.getByLabelText('Date'), DateTime.now().toISODate() as string);

    expect(screen.getByText('Save')).toBeEnabled();
    await user.click(screen.getByText('Save'));
    const tx = await Transaction.findOneOrFail(
      {
        where: { description: 'Grocery shopping' },
        relations: { splits: true },
      },
    );
    expect(tx).toEqual(expect.objectContaining({
      description: 'Grocery shopping',
      fk_currency: eur,
      splits: [
        expect.objectContaining({
          accountId: bankAccount.guid,
          quantityNum: -30,
          quantityDenom: 1,
          valueNum: -30,
          valueDenom: 1,
        }),
        expect.objectContaining({
          accountId: expensesAccount.guid,
          quantityNum: 30,
          quantityDenom: 1,
          valueNum: 30,
          valueDenom: 1,
        }),
      ],
    }));

    // STEP 6
    // Shows final disclaimer
    await screen.findByText('Good job!', { exact: false });
    await user.click(screen.getByText('Agreed!'));
  }, 10000);
});
