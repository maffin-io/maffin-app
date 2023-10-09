import React from 'react';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import { DateTime } from 'luxon';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import type { SWRResponse } from 'swr';

import Stocker from '@/apis/Stocker';
import MainSplit from '@/components/forms/transaction/MainSplit';
import * as queries from '@/lib/queries';
import * as apiHook from '@/hooks/api';
import type { Account, Commodity } from '@/book/entities';
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
  const EURSGD = 1.44;

  beforeEach(() => {
    eur = {
      guid: 'eur',
      mnemonic: 'EUR',
    } as Commodity;

    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(eur);
    jest.spyOn(apiHook, 'useAccounts')
      .mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(Stocker.prototype, 'getPrice').mockResolvedValue({ price: EURSGD, currency: 'EUR' });
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
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: EURSGD, currency: '' });

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
                type: 'STOCK',
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
    expect(mockGetPrice).not.toBeCalled();
  });

  it('sets value when quantity changes', async () => {
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

  it('sets value when quantity changes with different currency', async () => {
    const user = userEvent.setup();
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: EURSGD, currency: 'EUR' });

    render(
      <FormWrapper
        defaults={{
          fk_currency: { mnemonic: 'SGD' } as Commodity,
        } as FormValues}
      />,
    );

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

    expect(q0).toBeEnabled();
    expect(v0).toBeEnabled();
    await user.type(q0, '100');

    await waitFor(() => expect(q0).toHaveValue(100));
    await waitFor(() => expect(v0).toHaveValue(100 * EURSGD));
    expect(mockGetPrice).toHaveBeenLastCalledWith('EURSGD=X', DateTime.fromISO('2023-01-01'));
  });

  it('retrieves exchange rate for investment', async () => {
    const user = userEvent.setup();
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 100.1, currency: 'USD' });

    render(
      <FormWrapper
        defaults={{
          fk_currency: { mnemonic: 'SGD' } as Commodity,
          splits: [
            {
              fk_account: {
                name: 'path1',
                guid: 'account_guid_1',
                path: 'path1',
                type: 'STOCK',
                commodity: {
                  guid: 'googl',
                  mnemonic: 'GOOGL',
                } as Commodity,
              } as Account,
            },
          ],
        } as FormValues}
      />,
    );

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

    expect(q0).toBeEnabled();
    expect(v0).toBeEnabled();
    await user.type(q0, '100');

    await waitFor(() => expect(q0).toHaveValue(100));
    await waitFor(() => expect(v0).toHaveValue(100 * 100.1));
    expect(mockGetPrice).toHaveBeenLastCalledWith('GOOGL', DateTime.fromISO('2023-01-01'));
  });

  it('recalculates when date changes', async () => {
    const user = userEvent.setup();
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValueOnce({ price: 1.30, currency: '' });

    render(
      <FormWrapper
        defaults={{
          fk_currency: { mnemonic: 'SGD' } as Commodity,
        } as FormValues}
      />,
    );

    const dateField = screen.getByTestId('date');
    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

    user.clear(dateField);
    await user.type(q0, '100');
    await waitFor(() => expect(q0).toHaveValue(100));

    await user.type(dateField, '2023-01-20');
    await waitFor(() => expect(v0).toHaveValue(130));
    await waitFor(
      () => expect(mockGetPrice).toHaveBeenLastCalledWith('EURSGD=X', DateTime.fromISO('2023-01-20')),
    );
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
          } as Commodity,
        } as Account,
      },
    ],
    fk_currency: { guid: 'eur', mnemonic: 'EUR' },
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
