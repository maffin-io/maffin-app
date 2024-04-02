import React from 'react';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import { DateTime } from 'luxon';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  Account,
  Commodity,
  Price,
  Split,
} from '@/book/entities';
import SplitField from '@/components/forms/transaction/SplitField';
import type { FormValues } from '@/components/forms/transaction/types';
import * as queries from '@/lib/queries';
import * as apiHook from '@/hooks/api';
import { PriceDBMap } from '@/book/prices';

jest.mock('@/lib/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/queries'),
}));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('SplitField', () => {
  let eur: Commodity;

  beforeEach(() => {
    eur = {
      guid: 'eur',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;

    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(eur);
    jest.spyOn(apiHook, 'usePrices')
      .mockReturnValue({ data: undefined } as UseQueryResult<PriceDBMap>);
    jest.spyOn(apiHook, 'useAccounts')
      .mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
    // @ts-ignore
    jest.spyOn(Price, 'create').mockReturnValue({ value: 1 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with empty data', () => {
    const { container } = render(<FormWrapper />);
    expect(screen.getByRole('spinbutton', { name: 'splits.1.quantity' })).toBeVisible();
    expect(screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true })).not.toBeVisible();
    expect(container).toMatchSnapshot();
  });

  it('renders disabled', () => {
    render(<FormWrapper disabled />);

    expect(screen.getByLabelText('splits.1.account')).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'splits.1.quantity' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true })).toBeDisabled();
  });

  it('shows value field when txCurrency is different', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'account_guid_3',
            path: 'path3',
            type: 'EXPENSE',
            commodity: {
              guid: 'sgd',
              mnemonic: 'SGD',
              namespace: 'CURRENCY',
            },
          } as Account,
        ],
      } as UseQueryResult<Account[]>,
    );

    render(<FormWrapper />);

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path3'));

    expect(screen.getByRole('spinbutton', { name: 'splits.1.value' })).toBeVisible();
  });

  // When we load data for updating/deleting, we want to keep it as it is
  it('loads with default and doesnt reset value when update', async () => {
    render(
      <FormWrapper
        action="update"
        defaults={{
          fk_currency: { mnemonic: 'SGD' } as Commodity,
          splits: [
            {},
            {
              quantity: 50,
              value: 100,
              fk_account: {
                name: 'path1',
                guid: 'account_guid_1',
                path: 'path1',
                type: 'INVESTMENT',
                commodity: {
                  guid: 'eur',
                  mnemonic: 'EUR',
                } as Commodity,
              } as Account,
            },
          ],
        } as FormValues}
      />,
    );

    expect(screen.getByRole('spinbutton', { name: 'splits.1.value' })).toHaveValue(100);
    expect(screen.getByRole('spinbutton', { name: 'splits.1.quantity' })).toHaveValue(50);
  });

  it('filters account selection when default type is passed', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'account_guid_3',
            path: 'path3',
            type: 'EXPENSE',
            commodity: {
              guid: 'sgd',
              mnemonic: 'SGD',
              namespace: 'CURRENCY',
            },
          } as Account,
          {
            guid: 'account_guid_4',
            path: 'path4',
            type: 'INCOME',
            commodity: {
              guid: 'sgd',
              mnemonic: 'SGD',
              namespace: 'CURRENCY',
            },
          } as Account,
        ],
      } as UseQueryResult<Account[]>,
    );

    render(
      <FormWrapper
        action="add"
        defaults={{
          fk_currency: { mnemonic: 'SGD' } as Commodity,
          splits: [
            {},
            {
              quantity: 50,
              value: 100,
              fk_account: {
                type: 'INCOME',
              } as Account,
            },
          ],
        } as FormValues}
      />,
    );

    await user.click(screen.getByLabelText('splits.1.account'));
    expect(screen.queryByText('path3')).toBeNull();
    screen.getByText('path4');
  });

  describe('txCurrency on account selection', () => {
    beforeEach(() => {
      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'ASSET',
              commodity: eur,
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );
    });

    /**
     * If any account on one of the splits has a commodity which is not a currency, we set that as
     * txCurrency. An example would be buying GOOGL stock. Say we deduct 2000 euros from our bank
     * to buy. The GOOGL commodity is associated to USD so in the split with GOOGL account we will
     * see quantity with GOOGL and value with USD respectively. For the bank account we will see EUR
     * for quantity and USD for value.
     */
    it('sets txCurrency to currency of the account\'s commodity if not a currency', async () => {
      const user = userEvent.setup();
      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'ASSET',
              commodity: {
                namespace: 'OTHER',
                mnemonic: 'TICKER',
                guid: 'ticker_guid',
              },
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );
      jest.spyOn(Price, 'findOneByOrFail').mockResolvedValue({
        // @ts-ignore
        currency: {
          guid: 'usd',
          mnemonic: 'USD',
          namespace: 'CURRENCY',
        },
      });
      const mockSubmit = jest.fn();

      render(<FormWrapper submit={mockSubmit} />);

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      await user.click(screen.getByText('submit'));

      expect(Price.findOneByOrFail).toBeCalledWith({ fk_commodity: { guid: 'ticker_guid' } });
      expect(mockSubmit).toBeCalledWith(expect.objectContaining({
        fk_currency: {
          guid: 'usd',
          mnemonic: 'USD',
          namespace: 'CURRENCY',
        },
      }));

      // We show the value field so we see the conversion from commodity to currency
      expect(screen.getByRole('spinbutton', { name: 'splits.1.value' })).toBeVisible();
    });

    /**
     * Same as above but now with mainSplit being the one having the non currency commodity
     */
    it('sets txCurrency to currency of main split account\'s commodity if not a currency', async () => {
      const user = userEvent.setup();
      jest.spyOn(Price, 'findOneByOrFail').mockResolvedValue({
        // @ts-ignore
        currency: {
          guid: 'usd',
          mnemonic: 'USD',
          namespace: 'CURRENCY',
        },
      });
      const mockSubmit = jest.fn();

      render(
        <FormWrapper
          defaults={{
            splits: [
              {
                value: 0,
                quantity: 0,
                fk_account: {
                  name: 'path1',
                  guid: 'account_guid_1',
                  path: 'path1',
                  type: 'ASSET',
                  commodity: {
                    namespace: 'OTHER',
                    mnemonic: 'TICKER',
                    guid: 'ticker_guid',
                  },
                } as Account,
              } as Split,
              {
                value: 0,
                quantity: 0,
              } as Split,
            ],
          }}
          submit={mockSubmit}
        />,
      );

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      await user.click(screen.getByText('submit'));

      expect(Price.findOneByOrFail).toBeCalledWith({ fk_commodity: { guid: 'ticker_guid' } });
      expect(mockSubmit).toBeCalledWith(expect.objectContaining({
        fk_currency: {
          guid: 'usd',
          mnemonic: 'USD',
          namespace: 'CURRENCY',
        },
      }));

      // We show the value field so we see the conversion from commodity to currency
      expect(screen.getByRole('spinbutton', { name: 'splits.1.value' })).toBeVisible();
    });

    /**
     * If all of the splits have CURRENCY as namespace and txCurrency is different than
     * mainCurrency, we check if the new account we selected is mainCurrency, if so, we set
     * txCurrency to that
     */
    it('sets txCurrency to account commodity if it matches main currency', async () => {
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity;
      jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(usd);

      const user = userEvent.setup();
      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'ASSET',
              commodity: usd,
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );
      const mockSubmit = jest.fn();

      render(<FormWrapper submit={mockSubmit} />);

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      await user.click(screen.getByText('submit'));

      expect(mockSubmit).toBeCalledWith(expect.objectContaining({
        fk_currency: {
          guid: 'usd',
          mnemonic: 'USD',
          namespace: 'CURRENCY',
        },
      }));
    });

    /**
     * If all of the splits have CURRENCY as namespace and txCurrency is different than
     * mainCurrency, but the account we selected is not mainCurrency, we set txCurrency
     * to the currency of the first split
     */
    it('sets txCurrency to mainSplit commodity if currency', async () => {
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity;
      jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(usd);

      const user = userEvent.setup();
      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'ASSET',
              commodity: {
                guid: 'sgd',
                mnemonic: 'SGD',
                namespace: 'CURRENCY',
              },
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );
      const mockSubmit = jest.fn();

      render(<FormWrapper submit={mockSubmit} />);

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      await user.click(screen.getByText('submit'));

      expect(mockSubmit).toBeCalledWith(expect.objectContaining({
        fk_currency: {
          guid: 'eur',
          mnemonic: 'EUR',
          namespace: 'CURRENCY',
        },
      }));
    });
  });

  describe('exchange rate', () => {
    /**
     * If the account has the same commodity as txCurrency, then we override
     * value field with the value of quantity field when this one changes
     */
    it('overrides value with quantity when same currency', async () => {
      const user = userEvent.setup();
      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'EXPENSE',
              commodity: {
                guid: 'eur',
                mnemonic: 'EUR',
                namespace: 'CURRENCY',
              },
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );

      render(<FormWrapper />);

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });

      expect(q1).toBeVisible();
      expect(v1).not.toBeVisible();
      await user.type(v1, '200');
      await waitFor(() => expect(q1).toHaveValue(200));

      user.clear(q1);
      await waitFor(() => expect(v1).toHaveValue(0));
      await user.type(q1, '100');
      await waitFor(() => expect(q1).toHaveValue(100));
      await waitFor(() => expect(v1).toHaveValue(100));
    });

    /**
     * Check that quantity field gets autopouplated with value / exchangeRate
     * when the account's commodity is different from txCurrency
     */
    it('sets value * exchangeRate for quantity when different currency', async () => {
      const user = userEvent.setup();
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity;
      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([{
            fk_currency: eur,
            currency: eur,
            fk_commodity: usd,
            commodity: usd,
            value: 0.987,
          } as Price]),
        } as UseQueryResult<PriceDBMap>);
      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'EXPENSE',
              commodity: usd,
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );

      render(<FormWrapper />);

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });

      expect(q1).toBeVisible();
      expect(v1).toBeVisible();
      await user.type(v1, '200');
      await waitFor(() => expect(q1).toHaveValue(202.634));
    });

    /**
     * Check that quantity field gets autopouplated with value / exchangeRate
     * when the account's commodity is not a currency
     */
    it('sets value * exchangeRate for quantity when account commodity is not currency', async () => {
      const user = userEvent.setup();
      const ticker = {
        guid: 'ticker_guid',
        mnemonic: 'TICKER',
        namespace: 'OTHER',
      };
      // @ts-ignore
      jest.spyOn(Price, 'findOneByOrFail').mockResolvedValue({ currency: eur });
      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([{
            fk_commodity: ticker,
            commodity: ticker,
            fk_currency: eur,
            currency: eur,
            value: 500,
          } as Price]),
        } as UseQueryResult<PriceDBMap>);
      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'EXPENSE',
              commodity: ticker,
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );

      render(<FormWrapper />);

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });

      expect(q1).toBeVisible();
      expect(v1).toBeVisible();
      await user.type(v1, '500');
      await waitFor(() => expect(q1).toHaveValue(1));
    });

    /**
     * Checks that when we have a given exchangeRate and then we change back to
     * txCurrency being the same as the split's account, that the exchangeRate is back
     * to 1 which means value field and quantity field are equal
     */
    it('sets exchange rate back to 1 when txCurrency and account commodity are the same', async () => {
      const user = userEvent.setup();
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity;
      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([{
            fk_currency: eur,
            currency: eur,
            fk_commodity: usd,
            commodity: usd,
            value: 0.987,
          } as Price]),
        } as UseQueryResult<PriceDBMap>);
      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'EXPENSE',
              commodity: usd,
            } as Account,
            {
              guid: 'account_guid_3',
              path: 'path3',
              type: 'EXPENSE',
              commodity: eur,
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );

      render(<FormWrapper />);

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });

      expect(q1).toBeVisible();
      expect(v1).toBeVisible();
      await user.type(v1, '200');
      await waitFor(() => expect(q1).toHaveValue(202.634));

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path3'));

      await waitFor(() => expect(v1).toHaveValue(200));
      await waitFor(() => expect(q1).toHaveValue(200));
    });

    /**
     * When the mainSplit commodity is not a currency, we find the commodity's currency
     * and set that as the txCurrency. Then we need to find also the exchange rate between
     * the current split account currency and the txCurrency and set that accordingly
     *
     * In the test below we simulate this by setting the mainSplit account commodity to TICKER
     * which is related to EUR currency. Then the second split is for an account in USD.
     * This results in the quantity field being in USD and the value field being in EUR.
     */
    it('sets value * exchangeRate for quantity when mainSplit commodity is not a currency', async () => {
      const user = userEvent.setup();
      const ticker = {
        guid: 'ticker_guid',
        mnemonic: 'TICKER',
        namespace: 'OTHER',
      };
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      };
      // @ts-ignore
      jest.spyOn(Price, 'findOneByOrFail').mockResolvedValue({ currency: eur });
      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([{
            fk_commodity: usd,
            commodity: usd,
            fk_currency: eur,
            currency: eur,
            value: 0.987,
          } as Price]),
        } as UseQueryResult<PriceDBMap>);
      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'EXPENSE',
              commodity: usd,
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );

      render(
        <FormWrapper
          defaults={{
            splits: [
              {
                value: 0,
                quantity: 0,
                fk_account: {
                  name: 'path1',
                  guid: 'account_guid_1',
                  path: 'path1',
                  type: 'ASSET',
                  commodity: ticker,
                } as Account,
              } as Split,
              {
                value: 0,
                quantity: 0,
              } as Split,
            ],
          }}
        />,
      );

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });

      expect(q1).toBeVisible();
      expect(v1).toBeVisible();
      await user.type(v1, '200');
      await waitFor(() => expect(q1).toHaveValue(202.634));
    });

    it('recalculates when date changes', async () => {
      const user = userEvent.setup();
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity;
      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([
            {
              date: DateTime.fromISO('2023-01-01'),
              fk_commodity: usd,
              commodity: usd,
              fk_currency: eur,
              currency: eur,
              value: 0.987,
            } as Price,
            {
              date: DateTime.fromISO('2023-01-10'),
              fk_commodity: usd,
              commodity: usd,
              fk_currency: eur,
              currency: eur,
              value: 1.05,
            } as Price,
          ]),
        } as UseQueryResult<PriceDBMap>);

      jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
        {
          data: [
            {
              guid: 'account_guid_2',
              path: 'path2',
              type: 'EXPENSE',
              commodity: usd,
            } as Account,
          ],
        } as UseQueryResult<Account[]>,
      );

      render(<FormWrapper />);

      await user.click(screen.getByLabelText('splits.1.account'));
      await user.click(screen.getByText('path2'));

      const dateField = screen.getByTestId('date');
      const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
      const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });

      expect(q1).toBeVisible();
      expect(v1).toBeVisible();
      await user.type(v1, '200');
      await waitFor(() => expect(q1).toHaveValue(202.634));

      user.clear(dateField);
      await user.type(dateField, '2023-01-11');
      await waitFor(() => expect(q1).toHaveValue(190.476));
      await waitFor(() => expect(v1).toHaveValue(200));
    });
  });

  /**
   * When a user customises the quantity field for a transaction with different currencies
   * it means it is setting the exchangeRate explicitly and thus, we keep the value field
   * untouched.
   */
  it('keeps quantity when different commodities', async () => {
    const user = userEvent.setup();
    const usd = {
      guid: 'usd',
      mnemonic: 'USD',
      namespace: 'CURRENCY',
    };

    render(
      <FormWrapper
        defaults={{
          splits: [
            {
              value: 0,
              quantity: 0,
              fk_account: {
                name: 'path1',
                guid: 'account_guid_1',
                path: 'path1',
                type: 'ASSET',
                commodity: eur,
              } as Account,
            } as Split,
            {
              value: 100,
              quantity: 200,
              fk_account: {
                guid: 'account_guid_2',
                path: 'path2',
                type: 'EXPENSE',
                commodity: usd,
              } as Account,
            } as Split,
          ],
        }}
      />,
    );

    const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value' });

    user.clear(q1);
    await user.type(q1, '102');
    await waitFor(() => expect(q1).toHaveValue(102));
    await waitFor(() => expect(v1).toHaveValue(100));
  });
});

function FormWrapper(
  {
    action = 'add',
    disabled = false,
    defaults = {} as FormValues,
    submit,
  }: {
    action?: 'add' | 'update' | 'delete',
    disabled?: boolean,
    defaults?: Partial<FormValues>,
    submit?: Function,
  },
): JSX.Element {
  const account = {
    name: 'path1',
    guid: 'account_guid_1',
    path: 'path1',
    type: 'ASSET',
    commodity: {
      guid: 'eur',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity,
  } as Account;

  const defaultValues = {
    date: '2023-01-01',
    splits: [
      {
        value: 0,
        quantity: 0,
        fk_account: account as Account,
        account,
      },
      {
        value: 0,
        quantity: 0,
        fk_account: undefined,
      },
    ],
    fk_currency: { guid: 'eur', mnemonic: 'EUR', namespace: 'CURRENCY' },
  };
  const form = useForm<FormValues>({
    // These values reproduce the same initial state TransactionForm renders
    defaultValues: {
      ...defaultValues,
      ...defaults,
    },
  });

  // calling trigger creates some issues with background rendering for tests
  form.trigger = jest.fn();

  return (
    <form onSubmit={form.handleSubmit((data) => submit?.(data))}>
      <input
        id="dateInput"
        data-testid="date"
        className="block w-full m-0"
        {...form.register('date')}
        type="date"
      />
      <SplitField index={1} form={form} action={action} disabled={disabled} />
      <button type="submit">
        submit
      </button>
    </form>
  );
}
