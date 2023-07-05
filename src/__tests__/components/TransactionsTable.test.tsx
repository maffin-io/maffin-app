import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import { DataSource } from 'typeorm';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import TransactionsTable from '@/components/TransactionsTable';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

describe('TransactionsTable', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('shows empty message', async () => {
    render(
      <TransactionsTable
        accountId=""
        accounts={[]}
      />,
    );

    await screen.findByText('Select an account to see transactions');
  });

  it('displays splits as expected', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    await Commodity.create({
      guid: 'commodity_guid',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    const root = await Account.create({
      guid: 'root_account_guid',
      name: 'Root account',
      type: 'ROOT',
    }).save();

    await Account.create({
      guid: 'account_guid_1',
      name: 'bank',
      type: 'ASSET',
      fk_commodity: 'commodity_guid',
      parent: root,
    }).save();

    await Account.create({
      guid: 'account_guid_2',
      name: 'expense',
      type: 'EXPENSE',
      fk_commodity: 'commodity_guid',
      parent: root,
    }).save();

    await Transaction.create({
      guid: 'tx_guid',
      description: 'random expense',
      fk_currency: 'commodity_guid',
      date: DateTime.fromISO('2023-01-01'),
    }).save();

    await Split.create({
      guid: 'split1_guid',
      valueNum: 10,
      valueDenom: 100,
      quantityNum: 15,
      quantityDenom: 100,
      fk_transaction: 'tx_guid',
      fk_account: 'account_guid_1',
    }).save();

    await Split.create({
      guid: 'split2_guid',
      valueNum: 10,
      valueDenom: 100,
      quantityNum: 15,
      quantityDenom: 100,
      fk_transaction: 'tx_guid',
      fk_account: 'account_guid_2',
    }).save();

    const { container } = render(
      <TransactionsTable
        accountId="account_guid_1"
        accounts={[
          {
            guid: 'account_guid_1',
            path: 'Assets:bank',
            type: 'ASSET',
          } as Account,
          {
            guid: 'account_guid_2',
            path: 'Expenses:expense',
            type: 'EXPENSE',
          } as Account,
        ]}
      />,
    );

    await screen.findByText(/random expense/i);

    expect(container).toMatchSnapshot();
  });
});
