import { DateTime } from 'luxon';
import React from 'react';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource, IsNull } from 'typeorm';
import type { UseQueryResult } from '@tanstack/react-query';

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
import { PriceDBMap } from '@/book/prices';
import type { FormValues } from '@/components/forms/transaction/types';

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
    jest.spyOn(apiHook, 'usePrices')
      .mockReturnValue({ data: undefined } as UseQueryResult<PriceDBMap>);

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

    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          assetAccount,
          expenseAccount,
        ],
      } as UseQueryResult<Account[]>,
    );

    jest.spyOn(apiHook, 'useTransaction').mockReturnValue(
      {
        data: undefined,
      } as UseQueryResult<Transaction>,
    );
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('renders as expected with action add', async () => {
    const now = DateTime.now().toISODate();
    const { container } = render(
      <TransactionForm
        onSave={() => {}}
        action="add"
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
  ])('renders as expected with action %s', async (action) => {
    const now = DateTime.now().toISODate();

    jest.spyOn(apiHook, 'useTransaction').mockReturnValue(
      {
        data: {
          date: now,
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
              quantityNum: 100,
              quantityDenom: 1,
              fk_account: expenseAccount,
            }),
          ],
          fk_currency: assetAccount.commodity,
        },
      } as UseQueryResult<FormValues>,
    );

    const { container } = render(
      <TransactionForm
        onSave={() => {}}
        action={action as 'update' | 'delete'}
        guid="tx_guid"
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Date')).toHaveValue(now));
    screen.getByLabelText('Date');
    screen.getByLabelText('Description');

    expect(apiHook.useTransaction).toBeCalledWith({
      guid: 'tx_guid',
      enabled: true,
      select: expect.any(Function),
    });
    expect(container).toMatchSnapshot();
  });

  it.each([
    'update', 'delete',
  ])('does not override with exchangeRate for %s', async (action) => {
    const now = DateTime.now().toISODate();
    expenseAccount.fk_commodity = sgd;
    await expenseAccount.save();

    jest.spyOn(apiHook, 'useTransaction').mockReturnValue(
      {
        data: {
          date: now,
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
        },
      } as UseQueryResult<FormValues>,
    );

    render(
      <TransactionForm
        onSave={() => {}}
        action={action as 'update' | 'delete'}
        guid="tx_guid"
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Date')).toHaveValue(now));
    screen.getByLabelText('Date');
    screen.getByLabelText('Description');

    expect(screen.getByLabelText('splits.0.quantity')).toHaveValue(-100);
    expect(screen.getByLabelText('splits.0.value')).toHaveValue(-100);
    expect(screen.getByLabelText('splits.1.quantity')).toHaveValue(150);
    expect(screen.getByLabelText('splits.1.value')).toHaveValue(100);
  });

  /**
   * Cases for when both mainSplit and other splits have the same currency
   */
  describe('same commodity', () => {
    it('creates transaction, mutates and saves with expected params when both same currency', async () => {
      const user = userEvent.setup();
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
    });
  });

  /**
   * Cases for when the main split commodity is different than other splits
   */
  describe('different commodity', () => {
    beforeEach(() => {
      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([
            {
              fk_commodity: eur,
              commodity: eur,
              fk_currency: sgd,
              currency: sgd,
              value: 1 / 0.7,
            } as Price,
            {
              fk_commodity: sgd,
              commodity: sgd,
              fk_currency: eur,
              currency: eur,
              value: 0.7,
            } as Price,
          ]),
        } as UseQueryResult<PriceDBMap>);
    });

    /**
     * Check that we create a transaction with the right splits values and quantities.
     * txCurrency is EUR but we've selected an account for the mainSplit in SGD currency.
     *
     * When we select the account in EUR for splits[1], then txCurrency becomes EUR and then
     * the exchange rates come into play.
     */
    it('creates tx with mainSplit not being main currency', async () => {
      const user = userEvent.setup();
      assetAccount.fk_commodity = sgd;
      await assetAccount.save();
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
      // We haven't selected an account so txCurrency here is SGD (because assetAccount)
      await waitFor(() => expect(q1).toHaveValue(100));

      await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
      await user.click(screen.getByText('Expenses:random'));

      // At this point v0 becomes available because txCurrency is EUR
      const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });

      await waitFor(() => expect(q0).toHaveValue(-100)); // 100 SGD
      await waitFor(() => expect(v0).toHaveValue(-70)); // 70 EUR
      await waitFor(() => expect(v1).toHaveValue(70)); // 70 EUR
      await waitFor(() => expect(q1).toHaveValue(70)); // 70 EUR

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
              fk_commodity: sgd,
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
              fk_commodity: eur,
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

    /**
     * Same as above but with the mainSplit commodity being same with mainCurrency and split[1]
     * being different.
     */
    it('creates tx with split not being main currency', async () => {
      const user = userEvent.setup();
      expenseAccount.fk_commodity = sgd;
      await expenseAccount.save();
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
      // We haven't selected an account so txCurrency here is EUR (because assetAccount)
      await waitFor(() => expect(q1).toHaveValue(100));

      await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
      await user.click(screen.getByText('Expenses:random'));

      // At this point v1 becomes available because txCurrency is EUR
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value' });

      await waitFor(() => expect(q0).toHaveValue(-100)); // 100 EUR
      await waitFor(() => expect(v1).toHaveValue(100)); // 100 EUR
      await waitFor(() => expect(q1).toHaveValue(142.857)); // 142.857 SGD

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
            quantityNum: 142857,
            quantityDenom: 1000,
            valueNum: 100,
            valueDenom: 1,
          },
        ],
      });
      expect(tx.guid.length).toEqual(31);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    /**
     * Check that we create a transaction that buys 2 titles of commodity "TICKER". The
     * mainSplit is associated to the "TICKER" account which sets the currency of the transaction
     * to SGD as TICKER is paid in SGD.
     *
     * When we select an account in EUR as the Asset one to transfer the money from, we check
     * that all fields are displayed accordingly with the correct quantities accordingly to
     * exchange rates.
     */
    it('creates tx with mainSplit being INVESTMENT', async () => {
      const user = userEvent.setup();
      const ticker = await Commodity.create({
        guid: 'ticker',
        mnemonic: 'TICKER',
        namespace: 'OTHER',
      }).save();

      const tickerPrice = await Price.create({
        date: DateTime.fromISO('2023-01-01'),
        fk_commodity: ticker,
        commodity: ticker,
        fk_currency: sgd,
        currency: sgd,
        valueNum: 500,
        valueDenom: 1,
      }).save();

      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([
            tickerPrice,
            {
              fk_commodity: eur,
              commodity: eur,
              fk_currency: sgd,
              currency: sgd,
              value: 1 / 0.7,
            } as Price,
          ]),
        } as UseQueryResult<PriceDBMap>);

      const tickerAccount = await Account.create({
        guid: 'account_guid_3',
        name: 'Asset3',
        type: 'INVESTMENT',
        fk_commodity: ticker,
        parent: assetAccount,
      }).save();
      tickerAccount.path = 'Assets:Asset3';

      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            assetAccount,
            tickerAccount,
          ],
        } as UseQueryResult<Account[]>,
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
                  fk_account: tickerAccount,
                }),
                new Split(),
              ],
              fk_currency: assetAccount.commodity,
            }
          }
        />,
      );

      await user.type(screen.getByLabelText('Date'), '2023-01-01');
      await user.type(screen.getByLabelText('Description'), 'Buy TICKER');

      const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
      await user.type(q0, '2');
      await waitFor(() => expect(q0).toHaveValue(2));

      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      // We haven't selected an account so txCurrency here is SGD because TICKER's
      // currency is SGD
      await waitFor(() => expect(q1).toHaveValue(-1000));

      await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
      await user.click(screen.getByText('Assets:asset1'));

      // At this point v1 becomes available because txCurrency is SGD
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value' });
      const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

      await waitFor(() => expect(q0).toHaveValue(2)); // 2 TICKER
      await waitFor(() => expect(v0).toHaveValue(1000)); // 1000 SGD
      await waitFor(() => expect(v1).toHaveValue(-1000)); // -1000 SGD
      await waitFor(() => expect(q1).toHaveValue(-700)); // -700 EUR

      expect(screen.getByText('add')).not.toBeDisabled();
      await user.click(screen.getByText('add'));

      const tx = await Transaction.findOneOrFail({
        where: { description: 'Buy TICKER' },
        relations: {
          splits: {
            fk_account: true,
          },
        },
      });

      expect(tx).toMatchObject({
        guid: expect.any(String),
        date: DateTime.fromISO('2023-01-01'),
        description: 'Buy TICKER',
        fk_currency: sgd,
        splits: [
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_3',
            },
            quantityNum: 2,
            quantityDenom: 1,
            valueNum: 1000,
            valueDenom: 1,
          },
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_1',
            },
            quantityNum: -700,
            quantityDenom: 1,
            valueNum: -1000,
            valueDenom: 1,
          },
        ],
      });
      expect(tx.guid.length).toEqual(31);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    /**
     * Same as above but the mainSplit is now the asset account and the other split
     * is the one with the non currency commodity
     */
    it('creates tx with split account being INVESTMENT', async () => {
      const user = userEvent.setup();
      const ticker = await Commodity.create({
        guid: 'ticker',
        mnemonic: 'TICKER',
        namespace: 'OTHER',
      }).save();

      const tickerPrice = await Price.create({
        date: DateTime.fromISO('2023-01-01'),
        fk_commodity: ticker,
        commodity: ticker,
        fk_currency: sgd,
        currency: sgd,
        valueNum: 500,
        valueDenom: 1,
      }).save();

      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([
            tickerPrice,
            {
              fk_commodity: eur,
              commodity: eur,
              fk_currency: sgd,
              currency: sgd,
              value: 1 / 0.7,
            } as Price,
          ]),
        } as UseQueryResult<PriceDBMap>);

      const tickerAccount = await Account.create({
        guid: 'account_guid_3',
        name: 'Asset3',
        type: 'INVESTMENT',
        fk_commodity: ticker,
        parent: assetAccount,
      }).save();
      tickerAccount.path = 'Assets:asset3';

      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            assetAccount,
            tickerAccount,
          ],
        } as UseQueryResult<Account[]>,
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
      await user.type(screen.getByLabelText('Description'), 'Buy TICKER');

      const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
      await user.type(q0, '-700');
      await waitFor(() => expect(q0).toHaveValue(-700));

      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      // We haven't selected an account so txCurrency here is SGD because TICKER's
      // currency is SGD
      await waitFor(() => expect(q1).toHaveValue(700));

      await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
      await user.click(screen.getByText('Assets:asset3'));

      // At this point v1 becomes available because txCurrency is SGD
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value' });
      const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

      await waitFor(() => expect(q0).toHaveValue(-700)); // -700 EUR
      await waitFor(() => expect(v0).toHaveValue(-1000)); // -1000 SGD
      await waitFor(() => expect(v1).toHaveValue(1000)); // 1000 SGD
      await waitFor(() => expect(q1).toHaveValue(2)); // 2 TICKER

      expect(screen.getByText('add')).not.toBeDisabled();
      await user.click(screen.getByText('add'));

      const tx = await Transaction.findOneOrFail({
        where: { description: 'Buy TICKER' },
        relations: {
          splits: {
            fk_account: true,
          },
        },
      });

      expect(tx).toMatchObject({
        guid: expect.any(String),
        date: DateTime.fromISO('2023-01-01'),
        description: 'Buy TICKER',
        fk_currency: sgd,
        splits: [
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_1',
            },
            quantityNum: -700,
            quantityDenom: 1,
            valueNum: -1000,
            valueDenom: 1,
          },
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_3',
            },
            quantityNum: 2,
            quantityDenom: 1,
            valueNum: 1000,
            valueDenom: 1,
          },
        ],
      });
      expect(tx.guid.length).toEqual(31);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    /**
     * Check that we can create a transaction with multiple splits with different commodities
     * each. The main split is a non currency commodity while the other splits 1 is deducting
     * an amount from an ASSET account and the other an EXPENSE. This transaction simulates
     * buying a stock in SGD and paying fees in EUR.
     */
    it('creates tx with multiple splits', async () => {
      const user = userEvent.setup();
      const ticker = await Commodity.create({
        guid: 'ticker',
        mnemonic: 'TICKER',
        namespace: 'OTHER',
      }).save();

      const tickerPrice = await Price.create({
        date: DateTime.fromISO('2023-01-01'),
        fk_commodity: ticker,
        commodity: ticker,
        fk_currency: sgd,
        currency: sgd,
        valueNum: 500,
        valueDenom: 1,
      }).save();

      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([
            tickerPrice,
            {
              fk_commodity: eur,
              commodity: eur,
              fk_currency: sgd,
              currency: sgd,
              value: 1 / 0.7,
            } as Price,
          ]),
        } as UseQueryResult<PriceDBMap>);

      const tickerAccount = await Account.create({
        guid: 'account_guid_3',
        name: 'Asset3',
        type: 'INVESTMENT',
        fk_commodity: ticker,
        parent: assetAccount,
      }).save();
      tickerAccount.path = 'Assets:Asset3';

      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            assetAccount,
            tickerAccount,
            expenseAccount,
          ],
        } as UseQueryResult<Account[]>,
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
                  fk_account: tickerAccount,
                }),
                new Split(),
              ],
              fk_currency: assetAccount.commodity,
            }
          }
        />,
      );

      await user.type(screen.getByLabelText('Date'), '2023-01-01');
      await user.type(screen.getByLabelText('Description'), 'Buy TICKER');

      const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
      await user.type(q0, '2');
      await waitFor(() => expect(q0).toHaveValue(2));

      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      // We haven't selected an account so txCurrency here is SGD because TICKER's
      // currency is SGD
      await waitFor(() => expect(q1).toHaveValue(-1000));

      await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
      await user.click(screen.getByText('Assets:asset1'));

      // At this point v1 becomes available because txCurrency is SGD
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value' });
      const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

      await waitFor(() => expect(q0).toHaveValue(2)); // 2 TICKER
      await waitFor(() => expect(v0).toHaveValue(1000)); // 1000 SGD
      await waitFor(() => expect(v1).toHaveValue(-1000)); // -1000 SGD
      await waitFor(() => expect(q1).toHaveValue(-700)); // -700 EUR

      await user.click(screen.getByText('Add split', { exact: false }));

      await user.click(screen.getByRole('combobox', { name: 'splits.2.account' }));
      await user.click(screen.getByText('Expenses:random'));

      const q2 = screen.getByRole('spinbutton', { name: 'splits.2.quantity' });
      const v2 = screen.getByRole('spinbutton', { name: 'splits.2.value' });
      await user.type(v2, '5');
      await waitFor(() => expect(q2).toHaveValue(3.5)); // 3.5 EUR

      // We need to deduct the fee from the amount we've invested in the STOCK to make
      // the imbalance disappear
      await user.clear(v0);
      await user.type(v0, '995');

      expect(screen.getByText('add')).not.toBeDisabled();
      await user.click(screen.getByText('add'));

      const tx = await Transaction.findOneOrFail({
        where: { description: 'Buy TICKER' },
        relations: {
          splits: {
            fk_account: true,
          },
        },
      });

      expect(tx).toMatchObject({
        guid: expect.any(String),
        date: DateTime.fromISO('2023-01-01'),
        description: 'Buy TICKER',
        fk_currency: sgd,
        splits: [
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_3',
            },
            quantityNum: 2,
            quantityDenom: 1,
            valueNum: 995,
            valueDenom: 1,
          },
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_1',
            },
            quantityNum: -700,
            quantityDenom: 1,
            valueNum: -1000,
            valueDenom: 1,
          },
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_2',
            },
            quantityNum: 35,
            quantityDenom: 10,
            valueNum: 5,
            valueDenom: 1,
          },
        ],
      });
      expect(tx.guid.length).toEqual(31);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    /**
     * Same as above but with the commodity account being the last split as this triggers
     * a change of txCurrency for the two previous splits.
     */
    it('creates tx with multiple splits with investment split being last', async () => {
      const user = userEvent.setup();
      const ticker = await Commodity.create({
        guid: 'ticker',
        mnemonic: 'TICKER',
        namespace: 'OTHER',
      }).save();

      const tickerPrice = await Price.create({
        date: DateTime.fromISO('2023-01-01'),
        fk_commodity: ticker,
        commodity: ticker,
        fk_currency: sgd,
        currency: sgd,
        valueNum: 500,
        valueDenom: 1,
      }).save();

      assetAccount.fk_commodity = sgd;
      await assetAccount.save();

      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([
            tickerPrice,
            {
              fk_commodity: sgd,
              commodity: sgd,
              fk_currency: eur,
              currency: eur,
              value: 0.7,
            } as Price,
            {
              fk_commodity: eur,
              commodity: eur,
              fk_currency: sgd,
              currency: sgd,
              value: 1 / 0.7,
            } as Price,
          ]),
        } as UseQueryResult<PriceDBMap>);

      const tickerAccount = await Account.create({
        guid: 'account_guid_3',
        name: 'Asset3',
        type: 'INVESTMENT',
        fk_commodity: ticker,
        parent: assetAccount,
      }).save();
      tickerAccount.path = 'Assets:asset3';

      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            assetAccount,
            tickerAccount,
            expenseAccount,
          ],
        } as UseQueryResult<Account[]>,
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
      await user.type(screen.getByLabelText('Description'), 'Buy TICKER');

      const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
      await user.type(q0, '-1000');
      await waitFor(() => expect(q0).toHaveValue(-1000));

      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      // We haven't selected an account so txCurrency here is SGD
      await waitFor(() => expect(q1).toHaveValue(1000));

      await user.click(screen.getByRole('combobox', { name: 'splits.1.account' }));
      await user.click(screen.getByText('Expenses:random'));

      // At this point v0 becomes available because txCurrency is EUR
      const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });

      await waitFor(() => expect(v0).toHaveValue(-700)); // -700 EUR
      await waitFor(() => expect(v1).toHaveValue(700)); // 700 EUR
      await waitFor(() => expect(q1).toHaveValue(700)); // 700 EUR

      await user.click(screen.getByText('Add split', { exact: false }));

      await user.click(screen.getByRole('combobox', { name: 'splits.2.account' }));
      await user.click(screen.getByText('Assets:asset3'));

      const q2 = screen.getByRole('spinbutton', { name: 'splits.2.quantity' });
      const v2 = screen.getByRole('spinbutton', { name: 'splits.2.value' });
      await user.type(q2, '0');
      await user.type(v2, '0');

      // Because we now have 3 splits, the value for split1 doesn't get updated
      // with the total from mainSplit
      await user.clear(v1);
      await user.type(v1, '1000');

      expect(screen.getByText('add')).not.toBeDisabled();
      await user.click(screen.getByText('add'));

      const tx = await Transaction.findOneOrFail({
        where: { description: 'Buy TICKER' },
        relations: {
          splits: {
            fk_account: true,
          },
        },
      });

      expect(tx).toMatchObject({
        guid: expect.any(String),
        date: DateTime.fromISO('2023-01-01'),
        description: 'Buy TICKER',
        fk_currency: sgd,
        splits: [
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_1',
            },
            quantityNum: -1000,
            quantityDenom: 1,
            valueNum: -1000,
            valueDenom: 1,
          },
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_2',
            },
            quantityNum: 700,
            quantityDenom: 1,
            valueNum: 1000,
            valueDenom: 1,
          },
          {
            guid: expect.any(String),
            action: '',
            fk_account: {
              guid: 'account_guid_3',
            },
            quantityNum: 0,
            quantityDenom: 1,
            valueNum: 0,
            valueDenom: 1,
          },
        ],
      });
      expect(tx.guid.length).toEqual(31);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });

  it('refreshes investment cache when commodity is not CURRENCY', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();

    const stockCommodity = await Commodity.create({
      guid: 'stock_guid',
      namespace: 'STOCK',
      mnemonic: 'TICKER',
    }).save();

    const stockAccount = await Account.create({
      guid: 'stock_account',
      name: 'Stock',
      type: 'INVESTMENT',
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
  });

  describe('actions', () => {
    it('updates transaction', async () => {
      const user = userEvent.setup();
      const mockSave = jest.fn();

      const tx = await Transaction.create({
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

      jest.spyOn(apiHook, 'useTransaction').mockReturnValue(
        {
          data: {
            ...tx,
            date: tx.date.toISODate(),
          },
        } as UseQueryResult<FormValues>,
      );

      render(
        <TransactionForm
          action="update"
          onSave={mockSave}
          guid={tx.guid}
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
      extraExpenseAccount.path = 'Expenses:Extra';

      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            assetAccount,
            expenseAccount,
            extraExpenseAccount,
          ],
        } as UseQueryResult<Account[]>,
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
      jest.spyOn(apiHook, 'useTransaction').mockReturnValue(
        {
          data: {
            ...tx,
            date: tx.date.toISODate(),
          },
        } as UseQueryResult<FormValues>,
      );

      rerender(
        <TransactionForm
          action="update"
          onSave={mockSave}
          guid="tx_guid"
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
      jest.spyOn(apiHook, 'useTransaction').mockReturnValue(
        {
          data: {
            ...tx,
            date: tx.date.toISODate(),
          },
        } as UseQueryResult<FormValues>,
      );

      rerender(
        <TransactionForm
          action="delete"
          onSave={mockSave}
          guid="tx_guid"
        />,
      );

      await user.click(screen.getByText('delete'));

      const txs = await Transaction.find();
      expect(txs).toHaveLength(0);
      const splits = await Split.find();
      expect(splits).toHaveLength(0);
    });
  });
});
