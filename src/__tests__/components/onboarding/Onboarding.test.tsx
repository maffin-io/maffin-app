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
        <span id="save-button" />
        <span id="theme-button" />
        <span id="add-account" />
        <span id="accounts-table" />
        <Onboarding show />
      </div>,
    );

    // Select main currency and create initial accounts
    await screen.findByText('Welcome!', { exact: false });

    await user.click(screen.getByRole('combobox', { name: 'currency-selector' }));
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
        type: 'EXPENSE',
        name: 'Expenses',
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
        parentId: accounts[1].guid,
        placeholder: false,
        type: 'EXPENSE',
        name: 'Groceries',
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
        hidden: true,
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: accounts[6].guid,
        placeholder: false,
        type: 'EQUITY',
        name: 'Opening balances - EUR',
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: accounts[5].guid,
        placeholder: false,
        type: 'INCOME',
        name: 'Salary',
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: accounts[1].guid,
        placeholder: false,
        type: 'EXPENSE',
        name: 'Electricity',
      }),
      expect.objectContaining({
        fk_commodity: eur,
        parentId: accounts[1].guid,
        placeholder: false,
        type: 'EXPENSE',
        name: 'Water',
      }),
    ]);

    // Show accounts tree
    await screen.findByText('This represents your accounts tree', { exact: false });
    await user.click(screen.getByText('Next'));

    // Adds a bank account, all data is prefilled except the opening balance
    await screen.findByText('Let\'s add your first', { exact: false });
    await screen.findByText('Assets');
    await user.type(screen.getByLabelText('Opening balance'), '1000');

    expect(screen.getByText('add')).toBeEnabled();
    await user.click(screen.getByText('add'));
    const bankAccount = await Account.findOneByOrFail({ name: 'My bank' });
    expect(bankAccount).toEqual(expect.objectContaining({
      fk_commodity: eur,
      placeholder: false,
      type: 'BANK',
      name: 'My bank',
      parentId: accounts[2].guid,
    }));

    // Show accounts tree again
    await screen.findByText('See that now your bank account', { exact: false });
    await user.click(screen.getByText('Next'));

    // Adds a transaction between bank account and groceries account
    await screen.findByText('add the first transaction', { exact: false });
    await user.type(screen.getByLabelText('Date'), DateTime.now().toISODate() as string);

    expect(screen.getByText('add')).toBeEnabled();
    await user.click(screen.getByText('add'));
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
          accountId: (await Account.findOneByOrFail({ name: 'Groceries' })).guid,
          quantityNum: 30,
          quantityDenom: 1,
          valueNum: 30,
          valueDenom: 1,
        }),
      ],
    }));

    // Shows about the Save button
    await screen.findByText('We save the data automatically', { exact: false });
    await user.click(screen.getByText('Next'));

    // STEP 8
    // Shows final disclaimer
    await screen.findByText('Good job!', { exact: false });
    await user.click(screen.getByText('Agreed!'));
  }, 10000);
});
