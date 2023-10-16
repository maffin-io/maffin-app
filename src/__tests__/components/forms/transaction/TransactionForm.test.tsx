import { DateTime } from 'luxon';
import React from 'react';
import {
  act,
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
    const now = DateTime.now().toISODate();
    const { container } = render(
      <TransactionForm
        onSave={() => {}}
        action={action as 'add' | 'update' | 'delete'}
        defaultValues={
          {
            date: now as string,
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

    await waitFor(() => expect(screen.getByLabelText('Date')).toHaveValue(now));
    screen.getByLabelText('Date');
    screen.getByLabelText('Description');
    expect(container).toMatchSnapshot();
  });

  it.each([
    'update', 'delete',
  ])('does not override with exchangeRate when loaded with defaults for %s', async (action) => {
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 0.7, currency: '' });
    const now = DateTime.now().toISODate();
    expenseAccount.fk_commodity = sgd;
    await expenseAccount.save();
    render(
      <TransactionForm
        onSave={() => {}}
        action={action as 'add' | 'update' | 'delete'}
        defaultValues={
          {
            date: now as string,
            description: '',
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
                quantityNum: 150,
                quantityDenom: 1,
                fk_account: expenseAccount,
              }),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Date')).toHaveValue(now));
    screen.getByLabelText('Date');
    screen.getByLabelText('Description');

    expect(screen.getByLabelText('splits.0.quantity')).toHaveValue(-100);
    expect(screen.getByLabelText('splits.0.value')).toHaveValue(-100);
    expect(screen.getByLabelText('splits.1.quantity')).toHaveValue(150);
    expect(screen.getByLabelText('splits.1.value')).toHaveValue(100);

    expect(mockGetPrice).not.toBeCalled();
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
                fk_account: assetAccount,
              }),
              new Split(),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    await user.type(screen.getByLabelText('Date'), '2023-01-01');
    await user.type(screen.getByLabelText('Description'), 'My expense');

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    await user.type(q0, '-100');
    await waitFor(() => expect(q0).toHaveValue(-100));

    await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
    await user.click(screen.getByText('Expenses:random'));

    const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    await waitFor(() => expect(q1).toHaveValue(100));

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

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
    expect(swr.mutate).toBeCalledTimes(4);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, '/api/splits/account_guid_1');
    expect(swr.mutate).toHaveBeenNthCalledWith(2, '/api/splits/account_guid_2');
    expect(swr.mutate).toHaveBeenNthCalledWith(3, '/api/monthly-totals');
    expect(swr.mutate).toHaveBeenNthCalledWith(4, '/api/txs/latest');
  });

  it('creates transaction with mainSplit not being main currency', async () => {
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
              new Split(),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    await user.type(screen.getByLabelText('Date'), '2023-01-01');
    await user.type(screen.getByLabelText('Description'), 'My expense');

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    await user.type(q0, '-100');
    await waitFor(() => expect(q0).toHaveValue(-100));

    const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    // We haven't selected an account so txCurrency here is SGD
    await waitFor(() => expect(q1).toHaveValue(100));

    await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
    await user.click(screen.getByText('Expenses:random'));

    // We have selected an EUR account here which is our mainCurrency
    await waitFor(() => expect(q1).toHaveValue(70));

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

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

  it('creates multiple splits transaction with mainSplit not being main currency', async () => {
    const user = userEvent.setup();
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 0.7, currency: '' });
    assetAccount.fk_commodity = sgd;
    await assetAccount.save();
    const expenseAccount2 = await Account.create({
      guid: 'account_guid_3',
      name: 'random3',
      type: 'EXPENSE',
      fk_commodity: eur,
      parent: root,
      path: 'Expenses:random3',
    }).save();
    expenseAccount2.path = 'Expenses:random3';
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, expenseAccount, expenseAccount2],
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
              new Split(),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    await user.type(screen.getByLabelText('Date'), '2023-01-01');
    await user.type(screen.getByLabelText('Description'), 'My expense');

    // Set Amount to -100
    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    await user.type(q0, '-100');
    await waitFor(() => expect(q0).toHaveValue(-100));

    // Select account for first split
    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('Expenses:random'));

    // Check value for main split is set with main currency exchange
    // and that q1 is automatically populated
    const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });
    await waitFor(() => expect(v0).toHaveValue(-70));
    const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    await waitFor(() => expect(q1).toHaveValue(70));

    // Set custom quantity for first split
    user.clear(q1);
    // This gives act warnings but didn't find a better way to work around it
    await act(async () => {
      await user.type(q1, '50');
    });
    await waitFor(() => expect(q1).toHaveValue(50));
    const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });
    await waitFor(() => expect(v1).toHaveValue(50));

    // Add extra split
    await user.click(screen.getByText('Add split'));

    // Select account for second split
    await user.click(screen.getByRole('combobox', { name: 'splits.2.account' }));
    await user.click(screen.getByText('Expenses:random3'));
    const q2 = screen.getByRole('spinbutton', { name: 'splits.2.quantity' });

    // Set quantity for second split
    await user.type(q2, '20');
    await waitFor(() => expect(q2).toHaveValue(20));
    const v2 = screen.getByRole('spinbutton', { name: 'splits.2.value', hidden: true });
    await waitFor(() => expect(v2).toHaveValue(20));

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

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
          quantityNum: 50,
          quantityDenom: 1,
          valueNum: 50,
          valueDenom: 1,
        },
        {
          guid: expect.any(String),
          action: '',
          fk_account: {
            guid: 'account_guid_3',
          },
          quantityNum: 20,
          quantityDenom: 1,
          valueNum: 20,
          valueDenom: 1,
        },
      ],
    });
    expect(tx.guid.length).toEqual(31);
    expect(mockSave).toHaveBeenCalledTimes(1);
  }, 10000);

  it('creates transaction with split not being main currency', async () => {
    const user = userEvent.setup();
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 1.42857, currency: '' });
    expenseAccount.fk_commodity = sgd;
    await expenseAccount.save();
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
              new Split(),
            ],
            fk_currency: assetAccount.commodity,
          }
        }
      />,
    );

    await user.type(screen.getByLabelText('Date'), '2023-01-01');
    await user.type(screen.getByLabelText('Description'), 'My expense');

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    await user.type(q0, '-100');
    await waitFor(() => expect(q0).toHaveValue(-100));

    const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    // We haven't selected an account so txCurrency here is EUR (because ASSET account)
    await waitFor(() => expect(q1).toHaveValue(100));

    await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
    await user.click(screen.getByText('Expenses:random'));

    // We have selected an SGD account which is not our mainCurrency
    await waitFor(() => expect(q1).toHaveValue(70));

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

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
          quantityNum: 70,
          quantityDenom: 1,
          valueNum: 100,
          valueDenom: 1,
        },
      ],
    });
    expect(tx.guid.length).toEqual(31);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('refreshes investments key when account is investment', async () => {
    const user = userEvent.setup();
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 90, currency: '' });
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, expenseAccount],
      } as SWRResponse,
    );
    const mockSave = jest.fn();

    const stockCommodity = await Commodity.create({
      guid: 'stock_guid',
      namespace: 'NASDAQ',
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

    expect(screen.getByText('add')).toBeEnabled();
    await user.click(screen.getByText('add'));

    expect(swr.mutate).toBeCalledTimes(5);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, '/api/splits/account_guid_1');
    expect(swr.mutate).toHaveBeenNthCalledWith(2, '/api/investments');
    expect(swr.mutate).toHaveBeenNthCalledWith(3, '/api/splits/stock_account');
    expect(swr.mutate).toHaveBeenNthCalledWith(4, '/api/monthly-totals');
    expect(swr.mutate).toHaveBeenNthCalledWith(5, '/api/txs/latest');
  });

  // When the main split is a stock account the getExchangeRate rate logic
  // is different as it has to retrieve the price for that stock only
  // and then set the price to 1 / rate
  it('can create split transaction with stock being main split', async () => {
    const user = userEvent.setup();
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockImplementation(async () => Promise.resolve({ price: 90, currency: 'SGD' }));
    const stockCommodity = await Commodity.create({
      guid: 'stock_guid',
      namespace: 'NASDAQ',
      mnemonic: 'STOCK',
    }).save();

    const stockAccount = await Account.create({
      guid: 'stock_account',
      name: 'Stock',
      type: 'STOCK',
      fk_commodity: stockCommodity,
      parent: assetAccount,
    }).save();

    assetAccount.fk_commodity = sgd;
    await assetAccount.save();

    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, stockAccount],
      } as SWRResponse,
    );
    const mockSave = jest.fn();

    render(
      <TransactionForm
        action="add"
        onSave={mockSave}
        defaultValues={
          {
            guid: 'tx_guid',
            date: DateTime.fromISO('2023-01-01').toISODate() as string,
            description: 'Split STOCK',
            splits: [
              {
                // This is hacky but because we rely on destructured objects
                // to pass to the form because in there, we use the `value` and
                // `quantity` fields to evaluate if the form has changed. If
                // we don't destructure the object, value and quantity fields
                // don't exist and thus it fails. This behavior is what
                // currently happens in the real code too
                ...Split.create({
                  valueNum: 0,
                  valueDenom: 1,
                  quantityNum: 0,
                  quantityDenom: 1,
                  fk_account: stockAccount,
                }),
                account: stockAccount,
              } as Split,
              new Split(),
            ],
            fk_currency: stockAccount.commodity,
          }
        }
      />,
    );

    const q0 = screen.getByLabelText('splits.0.quantity');
    // Buy 100 stocks
    await user.type(q0, '100');
    await waitFor(() => expect(q0).toHaveValue(100));

    const q1 = screen.getByLabelText('splits.1.quantity');
    // We haven't selected an account so txCurrency here is STOCK
    await waitFor(() => expect(q1).toHaveValue(-100));

    await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
    await user.click(screen.getByText('Assets:asset1'));

    const v1 = screen.getByLabelText('splits.1.value');
    // We have selected an account with SGD currency which is the same currency
    // as the stock one
    await waitFor(() => expect(v1).toHaveValue(-100));
    await waitFor(() => expect(q1).toHaveValue(-9000));

    const v0 = screen.getByLabelText('splits.0.value');
    user.clear(v0);
    await user.type(v0, '0');
    user.clear(q1);
    // Set the quantity for asset account to 0 to reflect the new shares
    // cost nothing
    await user.type(q1, '0');

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

    const tx = await Transaction.findOneOrFail({
      where: { description: 'Split STOCK' },
      relations: {
        splits: {
          fk_account: true,
        },
      },
    });

    expect(tx).toMatchObject({
      guid: expect.any(String),
      date: DateTime.fromISO('2023-01-01'),
      description: 'Split STOCK',
      fk_currency: sgd,
      splits: [
        {
          guid: expect.any(String),
          action: '',
          fk_account: {
            guid: 'stock_account',
          },
          quantityNum: 100,
          quantityDenom: 1,
          valueNum: 0,
          valueDenom: 1,
        },
        {
          guid: expect.any(String),
          action: '',
          fk_account: {
            guid: 'account_guid_1',
          },
          quantityNum: 0,
          quantityDenom: 1,
          valueNum: 0,
          valueDenom: 1,
        },
      ],
    });
  });

  it('updates transaction', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [assetAccount, expenseAccount],
      } as SWRResponse,
    );
    const mockSave = jest.fn();

    await Transaction.create({
      guid: 'tx_guid',
      date: DateTime.fromISO('2023-01-01'),
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
    }).save();

    const tx = await Transaction.findOneOrFail({
      where: { description: 'description' },
      relations: {
        splits: {
          fk_account: true,
        },
      },
    });

    render(
      <TransactionForm
        action="update"
        onSave={mockSave}
        defaultValues={
          {
            ...tx,
            date: tx.date.toISODate() as string,
            fk_currency: tx.currency,
          }
        }
      />,
    );

    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), 'New description');

    await user.click(screen.getByText('update'));

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

    expect(screen.getByText('add')).toBeEnabled();
    await user.click(screen.getByText('add'));

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

    await user.click(screen.getByText('update'));

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

    expect(screen.getByText('add')).toBeEnabled();
    await user.click(screen.getByText('add'));

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

    await user.click(screen.getByText('delete'));

    const txs = await Transaction.find();
    expect(txs).toHaveLength(0);
    const splits = await Split.find();
    expect(splits).toHaveLength(0);
  });
});
