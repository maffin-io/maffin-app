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
import type { Account, Commodity } from '@/book/entities';
import { Split } from '@/book/entities';
import SplitField from '@/components/forms/transaction/SplitField';
import { toFixed } from '@/helpers/number';
import type { FormValues } from '@/components/forms/transaction/types';
import * as queries from '@/lib/queries';
import * as apiHook from '@/hooks/api';

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
  const EURSGD = 1.44;

  beforeEach(() => {
    eur = {
      guid: 'eur',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;

    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(eur);
    jest.spyOn(apiHook, 'useAccounts')
      .mockReturnValue({ data: undefined } as SWRResponse);
    jest.spyOn(Stocker.prototype, 'getPrice').mockResolvedValue({ price: EURSGD, currency: 'EUR' });
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
      } as SWRResponse,
    );

    render(<FormWrapper />);

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path3'));

    expect(screen.getByRole('spinbutton', { name: 'splits.1.value' })).toBeVisible();
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
            {},
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

    expect(screen.getByRole('spinbutton', { name: 'splits.1.value' })).toHaveValue(100);
    expect(screen.getByRole('spinbutton', { name: 'splits.1.quantity' })).toHaveValue(50);
    expect(mockGetPrice).not.toBeCalled();
  });

  it('sets currency on account selection if it matches main currency', async () => {
    const sgd = {
      guid: 'sgd',
      mnemonic: 'SGD',
      namespace: 'CURRENCY',
    } as Commodity;
    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(sgd);

    const user = userEvent.setup();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'account_guid_2',
            path: 'path2',
            type: 'ASSET',
            commodity: sgd,
          } as Account,
        ],
      } as SWRResponse,
    );

    render(<FormWrapper />);

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path2'));

    // If we don't show value field it means the currency of the account matches
    // the transaction currency
    expect(screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true })).not.toBeVisible();
  });

  // If the split has the same currency as the transactions' one, value and quantity
  // have to match
  it('overrides value with quantity when same currency', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'account_guid_3',
            path: 'path3',
            type: 'EXPENSE',
            commodity: {
              guid: 'eur',
              mnemonic: 'EUR',
            },
          } as Account,
        ],
      } as SWRResponse,
    );

    render(<FormWrapper />);

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path3'));

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

  // We do automatic currency exchange so if the user changes the value
  // on purpose it means they want custom exchange rate.
  it('converts quantity, keeps value when quantity changes if currency is different', async () => {
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
      } as SWRResponse,
    );

    render(<FormWrapper />);

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path3'));

    const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value' });

    expect(q1).toBeVisible();
    expect(v1).toBeVisible();
    await user.type(v1, '200');
    await waitFor(() => expect(q1).toHaveValue(toFixed(200 / EURSGD, 2)));

    user.clear(q1);
    await user.type(q1, '100');
    await waitFor(() => expect(q1).toHaveValue(100));
    await waitFor(() => expect(v1).toHaveValue(200));
  });

  it('retrieves exchange rate for investment', async () => {
    const user = userEvent.setup();
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 100, currency: 'USD' });
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            name: 'GOOGL',
            guid: 'account_guid_3',
            path: 'googl',
            type: 'STOCK',
            commodity: {
              guid: 'googl',
              mnemonic: 'GOOGL',
            },
          } as Account,
        ],
      } as SWRResponse,
    );

    render(<FormWrapper />);
    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('googl'));

    const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value' });

    expect(q1).toBeEnabled();
    expect(v1).toBeEnabled();
    await user.type(v1, '200');
    await waitFor(() => expect(q1).toHaveValue(2));
    expect(mockGetPrice).toHaveBeenLastCalledWith('GOOGL', DateTime.fromISO('2023-01-01'));
  });

  it('selects CURRENCY as tx currency when investment', async () => {
    const user = userEvent.setup();
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValueOnce({ price: 100, currency: 'USD' });
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            name: 'path1',
            guid: 'account_guid_1',
            path: 'path1',
            type: 'ASSET',
            commodity: {
              guid: 'usd',
              mnemonic: 'USD',
              namespace: 'CURRENCY',
            } as Commodity,
          } as Account,
        ],
      } as SWRResponse,
    );

    const account = {
      name: 'GOOGL',
      guid: 'account_guid_3',
      path: 'googl',
      type: 'STOCK',
      commodity: {
        guid: 'googl',
        mnemonic: 'GOOGL',
        namespace: 'STOCK',
      },
    };

    render(
      <FormWrapper
        defaults={{
          fk_currency: { mnemonic: 'GOOGL' } as Commodity,
          splits: [
            {
              quantity: 50,
              value: 100,
              fk_account: account,
              account,
            },
            new Split(),
          ],
        } as FormValues}
      />,
    );

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path1'));

    expect(screen.getByLabelText('splits.1.quantity')).toBeVisible();
    // if value is not visible on the split, it means the tx currency
    // is the same as the split's account
    await waitFor(() => expect(screen.getByLabelText('splits.1.value')).not.toBeVisible());
  });

  it('recalculates quantity from value when date changes', async () => {
    const user = userEvent.setup();
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValueOnce({ price: EURSGD, currency: '' })
      // .mockResolvedValueOnce({ price: EURSGD, currency: '' })
      .mockResolvedValueOnce({ price: 1.30, currency: '' });
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
      } as SWRResponse,
    );

    render(<FormWrapper />);

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path3'));

    const dateField = screen.getByTestId('date');
    const q0 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    const v0 = screen.getByRole('spinbutton', { name: 'splits.1.value' });

    await user.type(v0, '100');

    await waitFor(() => expect(q0).toHaveValue(toFixed(100 / EURSGD, 2)));
    await waitFor(() => expect(v0).toHaveValue(100));

    user.clear(dateField);
    // This creates act warning because we have nothing to wait for to check
    // that the exchange rate has been set
    await user.type(dateField, '2023-01-20');
    await waitFor(() => expect(q0).toHaveValue(toFixed(100 / 1.30, 2)));
    await waitFor(() => expect(v0).toHaveValue(100));
    expect(mockGetPrice).toHaveBeenLastCalledWith('SGDEUR=X', DateTime.fromISO('2023-01-20'));
  });

  it('recalculates when account changes', async () => {
    const user = userEvent.setup();
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValueOnce({ price: 1.30, currency: '' })
      .mockResolvedValueOnce({ price: 1.30, currency: '' });
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
            },
          } as Account,
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
      } as SWRResponse,
    );

    render(<FormWrapper />);

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path2'));

    const q0 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    const v0 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });
    await user.type(v0, '100');

    expect(v0).toHaveValue(100);
    expect(v0).not.toBeVisible();
    await waitFor(() => expect(q0).toHaveValue(100));

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path3'));

    await waitFor(
      () => expect(mockGetPrice).toHaveBeenLastCalledWith('SGDEUR=X', DateTime.fromISO('2023-01-01')),
    );

    await waitFor(() => expect(q0).toHaveValue(toFixed(100 / 1.30, 2)));
    await waitFor(() => expect(v0).toHaveValue(100));
    expect(v0).toBeVisible();
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
    <>
      <input
        id="dateInput"
        data-testid="date"
        className="block w-full m-0"
        {...form.register('date')}
        type="date"
      />
      <SplitField index={1} form={form} disabled={disabled} />
    </>
  );
}
