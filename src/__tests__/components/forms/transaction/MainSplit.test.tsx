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

import MainSplit from '@/components/forms/transaction/MainSplit';
import * as queries from '@/lib/queries';
import * as apiHook from '@/hooks/api';
import { Price } from '@/book/entities';
import { PriceDBMap } from '@/book/prices';
import type { Account, Commodity, Split } from '@/book/entities';
import type { FormValues } from '@/components/forms/transaction/types';

jest.mock('@/lib/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/queries'),
}));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('MainSplit', () => {
  let eur: Commodity;

  beforeEach(() => {
    eur = {
      guid: 'eur',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;

    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(eur);
    jest.spyOn(apiHook, 'useAccounts')
      .mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
    jest.spyOn(apiHook, 'usePrices')
      .mockReturnValue({ data: undefined } as UseQueryResult<PriceDBMap>);
    // @ts-ignore
    jest.spyOn(Price, 'create').mockReturnValue({ value: 1 });
  });

  it('renders with empty data', () => {
    const { container } = render(<FormWrapper />);
    expect(screen.getByRole('spinbutton', { name: 'splits.0.quantity' })).toBeVisible();
    expect(screen.getByRole('spinbutton', { name: '', hidden: true })).not.toBeVisible();
    expect(container).toMatchSnapshot();
  });

  it('renders disabled', () => {
    render(<FormWrapper disabled />);

    expect(screen.getByRole('spinbutton', { name: 'splits.0.quantity' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: '', hidden: true })).toBeDisabled();
  });

  it('shows value field when txCurrency is different', async () => {
    render(
      <FormWrapper
        defaults={{
          fk_currency: { mnemonic: 'SGD' } as Commodity,
        } as FormValues}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('spinbutton', { name: 'splits.0.value' })).toBeVisible();
    });
  });

  // When we load data through defaults, we want to keep it as
  // we are loading the split for deleting or updating
  it('loads with default and doesnt reset value', async () => {
    render(
      <FormWrapper
        defaults={{
          fk_currency: { mnemonic: 'SGD' } as Commodity,
          splits: [
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

    expect(screen.getByRole('spinbutton', { name: 'splits.0.value' })).toHaveValue(100);
    expect(screen.getByRole('spinbutton', { name: 'splits.0.quantity' })).toHaveValue(50);
  });

  describe('exchange rate', () => {
    it('sets value field when quantity field changes', async () => {
      const user = userEvent.setup();
      render(<FormWrapper />);

      const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
      const v0 = screen.getByRole('spinbutton', { name: '', hidden: true });

      expect(q0).toBeEnabled();
      expect(v0).toBeEnabled();
      await user.type(q0, '100');

      await waitFor(() => expect(q0).toHaveValue(100));
      await waitFor(() => expect(v0).toHaveValue(100));
    });

    /**
     * Check that value field gets autopouplated with quantity * exchangeRate
     * when the account's commodity is different from txCurrency
     */
    it('sets value field to quantity * exchangeRate when different currency', async () => {
      const user = userEvent.setup();
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity;
      jest.spyOn(apiHook, 'usePrices')
        .mockReturnValue({
          data: new PriceDBMap([{
            fk_currency: usd,
            currency: usd,
            fk_commodity: eur,
            commodity: eur,
            value: 1.013,
          } as Price]),
        } as UseQueryResult<PriceDBMap>);

      render(
        <FormWrapper
          defaults={{
            fk_currency: usd,
          } as FormValues}
        />,
      );

      const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
      const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

      expect(q0).toBeEnabled();
      expect(v0).toBeEnabled();
      await user.type(q0, '100');

      await waitFor(() => expect(q0).toHaveValue(100));
      await waitFor(() => expect(v0).toHaveValue(101.3));
    });

    /**
     * Check that value field gets autopouplated with quantity * exchangeRate
     * when the account's commodity is different from txCurrency being a non currency
     */
    it('sets value field to quantity * exchangeRate with non currency account', async () => {
      const user = userEvent.setup();
      const ticker = {
        guid: 'ticker',
        mnemonic: 'TICKER',
        namespace: 'OTHER',
      } as Commodity;
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

      render(
        <FormWrapper
          defaults={{
            fk_currency: eur,
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
            ],
          } as FormValues}
        />,
      );

      const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
      const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

      expect(q0).toBeEnabled();
      expect(v0).toBeEnabled();
      await user.type(q0, '10');

      await waitFor(() => expect(q0).toHaveValue(10));
      await waitFor(() => expect(v0).toHaveValue(5000));
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
              fk_commodity: eur,
              commodity: eur,
              fk_currency: usd,
              currency: usd,
              value: 1.10,
            } as Price,
            {
              date: DateTime.fromISO('2023-01-10'),
              fk_commodity: eur,
              commodity: eur,
              fk_currency: usd,
              currency: usd,
              value: 0.987,
            } as Price,
          ]),
        } as UseQueryResult<PriceDBMap>);

      render(
        <FormWrapper
          defaults={{
            fk_currency: usd,
          } as FormValues}
        />,
      );

      const dateField = screen.getByTestId('date');
      const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
      const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

      await user.type(q0, '100');
      await waitFor(() => expect(q0).toHaveValue(100));
      await waitFor(() => expect(v0).toHaveValue(110));

      user.clear(dateField);
      await user.type(dateField, '2023-01-10');
      await waitFor(() => expect(v0).toHaveValue(98.7));
    });
  });
});

function FormWrapper(
  {
    disabled = false,
    defaults = {} as FormValues,
  }: {
    disabled?: boolean,
    defaults?: FormValues,
  },
): JSX.Element {
  const defaultValues = {
    date: '2023-01-01',
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
            guid: 'eur',
            mnemonic: 'EUR',
            namespace: 'CURRENCY',
          } as Commodity,
        } as Account,
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
    <>
      <input
        id="dateInput"
        data-testid="date"
        className="block w-full m-0"
        {...form.register('date')}
        type="date"
      />
      <MainSplit form={form} disabled={disabled} />
    </>
  );
}
