import { DateTime } from 'luxon';
import React from 'react';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource, IsNull } from 'typeorm';
import * as swr from 'swr';
import type { SWRResponse } from 'swr';

import Stocker from '@/apis/Stocker';
import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import * as queries from '@/lib/queries';
import * as apiHook from '@/hooks/api';

jest.mock('swr');

jest.mock('@/lib/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/queries'),
}));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('TransactionForm', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let sgd: Commodity;
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
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: [] } as SWRResponse);

    root = await Account.create({
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

  it.each([
    'add', 'update', 'delete',
  ])('renders as expected with action %s', async (action) => {
    const { container } = render(
      <TransactionForm
        onSave={() => {}}
        action={action as 'add' | 'update' | 'delete'}
        defaultValues={
          {
            date: DateTime.now().toISODate() as string,
            description: '',
            splits: [
              Split.create({
                value: 0,
                quantity: 0,
                fk_account: assetAccount,
              }),
              Split.create({
                value: 0,
                quantity: 0,
              }),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    screen.getByLabelText('Date');
    screen.getByLabelText('Description');
    expect(container).toMatchSnapshot();
  });

  it('creates transaction, mutates and saves with expected params when both same currency', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, expenseAccount],
      } as SWRResponse,
    );
    const mockSave = jest.fn();

    render(
      <TransactionForm
        onSave={mockSave}
        defaultValues={
          {
            date: '',
            description: '',
            splits: [
              Split.create({
                value: 0,
                quantity: 0,
                fk_account: assetAccount,
              }),
              Split.create({
                value: 0,
                quantity: 0,
              }),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

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
    expect(tx.guid.length).toEqual(31);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(swr.mutate).toBeCalledTimes(2);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, '/api/splits/account_guid_1');
    expect(swr.mutate).toHaveBeenNthCalledWith(2, '/api/splits/account_guid_2');
  });

  it('creates transaction with expected params with different currency', async () => {
    const user = userEvent.setup();
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 0.7, currency: '' });
    assetAccount.fk_commodity = sgd;
    await assetAccount.save();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, expenseAccount],
      } as SWRResponse,
    );
    const mockSave = jest.fn();

    render(
      <TransactionForm
        onSave={mockSave}
        defaultValues={
          {
            date: '',
            description: '',
            splits: [
              Split.create({
                value: 0,
                quantity: 0,
                fk_account: assetAccount,
              }),
              Split.create({
                value: 0,
                quantity: 0,
              }),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

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
    expect(tx.guid.length).toEqual(31);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('refreshes investments key when account is investment', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, expenseAccount],
      } as SWRResponse,
    );
    const mockSave = jest.fn();

    const stockCommodity = await Commodity.create({
      guid: 'stock_guid',
      namespace: 'NASDAW',
      mnemonic: 'STOCK',
    }).save();

    const stockAccount = await Account.create({
      guid: 'stock_account',
      name: 'Stock',
      type: 'STOCK',
      fk_commodity: stockCommodity,
      parent: assetAccount,
    }).save();

    render(
      <TransactionForm
        action="add"
        onSave={mockSave}
        defaultValues={
          {
            guid: 'tx_guid',
            date: DateTime.fromISO('2023-01-01').toISODate() as string,
            description: 'description',
            splits: [
              Split.create({
                valueNum: -100,
                valueDenom: 1,
                quantityNum: -100,
                quantityDenom: 1,
                fk_account: assetAccount,
              }),
              Split.create({
                valueNum: 100,
                valueDenom: 1,
                quantityNum: 100,
                quantityDenom: 1,
                fk_account: stockAccount,
              }),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    expect(screen.getByText('Save')).toBeEnabled();
    await user.click(screen.getByText('Save'));

    expect(swr.mutate).toBeCalledTimes(3);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, '/api/splits/account_guid_1');
    expect(swr.mutate).toHaveBeenNthCalledWith(2, '/api/investments');
    expect(swr.mutate).toHaveBeenNthCalledWith(3, '/api/splits/stock_account');
  });

  it('updates transaction', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, expenseAccount],
      } as SWRResponse,
    );
    const mockSave = jest.fn();

    const { rerender } = render(
      <TransactionForm
        action="add"
        onSave={mockSave}
        defaultValues={
          {
            guid: 'tx_guid',
            date: DateTime.fromISO('2023-01-01').toISODate() as string,
            description: 'description',
            splits: [
              Split.create({
                valueNum: -100,
                valueDenom: 1,
                quantityNum: -100,
                quantityDenom: 1,
                fk_account: assetAccount,
              }),
              Split.create({
                valueNum: 100,
                valueDenom: 1,
                quantityNum: 100,
                quantityDenom: 1,
                fk_account: expenseAccount,
              }),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    expect(screen.getByText('Save')).toBeEnabled();
    await user.click(screen.getByText('Save'));

    const tx = await Transaction.findOneOrFail({
      where: { description: 'description' },
      relations: {
        splits: {
          fk_transaction: {
            splits: {
              fk_account: true,
            },
          },
          fk_account: true,
        },
      },
    });

    rerender(
      <TransactionForm
        action="update"
        onSave={mockSave}
        defaultValues={
          {
            ...tx,
            date: tx.date.toISODate() as string,
            fk_currency: tx.currency as Commodity,
          }
        }
      />,
    );

    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), 'New description');

    await user.click(screen.getByText('Update'));

    const txs = await Transaction.find();
    expect(txs).toHaveLength(1);
    expect(txs[0].description).toEqual('New description');
  });

  it('updates doesnt leave splits with empty transaction', async () => {
    const user = userEvent.setup();

    const extraExpenseAccount = await Account.create({
      guid: 'account_guid_3',
      name: 'Extra',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
    }).save();

    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, expenseAccount, extraExpenseAccount],
      } as SWRResponse,
    );
    const mockSave = jest.fn();

    const { rerender } = render(
      <TransactionForm
        action="add"
        onSave={mockSave}
        defaultValues={
          {
            guid: 'tx_guid',
            date: DateTime.fromISO('2023-01-01').toISODate() as string,
            description: 'description',
            splits: [
              Split.create({
                valueNum: -200,
                valueDenom: 1,
                quantityNum: -200,
                quantityDenom: 1,
                fk_account: assetAccount,
              }),
              Split.create({
                valueNum: 100,
                valueDenom: 1,
                quantityNum: 100,
                quantityDenom: 1,
                fk_account: expenseAccount,
              }),
              Split.create({
                valueNum: 100,
                valueDenom: 1,
                quantityNum: 100,
                quantityDenom: 1,
                fk_account: extraExpenseAccount,
              }),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    expect(screen.getByText('Save')).toBeEnabled();
    await user.click(screen.getByText('Save'));

    const tx = await Transaction.findOneOrFail({
      where: { description: 'description' },
      relations: {
        splits: {
          fk_transaction: {
            splits: {
              fk_account: true,
            },
          },
          fk_account: true,
        },
      },
    });

    rerender(
      <TransactionForm
        action="update"
        onSave={mockSave}
        defaultValues={
          {
            ...tx,
            date: tx.date.toISODate() as string,
            fk_currency: tx.currency as Commodity,
          }
        }
      />,
    );

    await user.click(screen.getByText('X'));
    const [, q1] = screen.getAllByRole('spinbutton');
    await user.type(q1, '200');

    await user.click(screen.getByText('Update'));

    const splits = await Split.findBy({
      fk_transaction: IsNull(),
    });
    expect(splits).toHaveLength(0);
    const txs = await Transaction.find();
    expect(txs).toHaveLength(1);
  });

  it('deletes transaction and splits', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, expenseAccount],
      } as SWRResponse,
    );
    const mockSave = jest.fn();

    const { rerender } = render(
      <TransactionForm
        action="add"
        onSave={mockSave}
        defaultValues={
          {
            guid: 'tx_guid',
            date: DateTime.fromISO('2023-01-01').toISODate() as string,
            description: 'description',
            splits: [
              Split.create({
                valueNum: -100,
                valueDenom: 1,
                quantityNum: -100,
                quantityDenom: 1,
                fk_account: assetAccount,
              }),
              Split.create({
                valueNum: 100,
                valueDenom: 1,
                quantityNum: 100,
                quantityDenom: 1,
                fk_account: expenseAccount,
              }),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    expect(screen.getByText('Save')).toBeEnabled();
    await user.click(screen.getByText('Save'));

    const tx = await Transaction.findOneOrFail({
      where: { description: 'description' },
      relations: {
        splits: {
          fk_transaction: {
            splits: {
              fk_account: true,
            },
          },
          fk_account: true,
        },
      },
    });

    rerender(
      <TransactionForm
        action="delete"
        onSave={mockSave}
        defaultValues={
          {
            ...tx,
            date: tx.date.toISODate() as string,
            fk_currency: tx.currency as Commodity,
          }
        }
      />,
    );

    await user.click(screen.getByText('Delete'));

    const txs = await Transaction.find();
    expect(txs).toHaveLength(0);
    const splits = await Split.find();
    expect(splits).toHaveLength(0);
  });
});
