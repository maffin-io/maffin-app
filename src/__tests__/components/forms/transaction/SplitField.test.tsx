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
import SplitField from '@/components/forms/transaction/SplitField';
import type { FormValues } from '@/components/forms/transaction/types';
import * as queries from '@/book/queries';
import * as apiHook from '@/hooks/useApi';

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/hooks/useApi', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useApi'),
}));

describe('SplitField', () => {
  let eur: Commodity;

  beforeEach(() => {
    eur = {
      guid: 'eur',
      mnemonic: 'EUR',
    } as Commodity;

    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(eur);
    jest.spyOn(apiHook, 'default')
      .mockReturnValue({ data: undefined } as SWRResponse);
  });

  it('renders with empty data', () => {
    const { container } = render(<FormWrapper />);
    expect(container).toMatchSnapshot();
  });

  it('renders disabled', () => {
    render(<FormWrapper disabled />);

    expect(screen.getByLabelText('splits.1.account')).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'splits.0.quantity' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'splits.0.value', hidden: true })).toBeDisabled();
  });

  it('enables value field when date filled and account is selected', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    await user.type(screen.getByTestId('date'), '2023-01-01');

    const [q0, q1] = screen.getAllByRole('spinbutton');
    expect(q0).toBeEnabled();
    expect(q1).toBeEnabled();
  });

  it('shows value field when txCurrency is different', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: [
          {
            guid: 'account_guid_3',
            path: 'path3',
            type: 'EXPENSE',
            commodity: {
              guid: 'sgd',
              mnemonic: 'SGD',
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

  it('sets currency to account selection', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: [
          {
            guid: 'account_guid_1',
            path: 'path1',
            type: 'ASSET',
            commodity: {
              guid: 'sgd',
              mnemonic: 'SGD',
            },
          } as Account,
        ],
      } as SWRResponse,
    );

    render(<FormWrapper />);

    await user.click(screen.getByLabelText('splits.0.account'));
    await user.click(screen.getByText('path1'));

    screen.getByText('S$');
    expect(screen.getAllByText('€')).toHaveLength(2);
  });

  it('sets value when quantity changes', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);
    await user.type(screen.getByTestId('date'), '2023-01-01');

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value', hidden: true });

    expect(q0).toBeEnabled();
    expect(v0).toBeEnabled();
    await user.type(q0, '100');

    await waitFor(() => expect(q0).toHaveValue(100));
    await waitFor(() => expect(v0).toHaveValue(100));
  });

  it('sets value * exchangeRate when quantity changes and currency is not txCurrency', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: [
          {
            guid: 'account_guid_1',
            path: 'path1',
            type: 'ASSET',
            commodity: {
              guid: 'sgd',
              mnemonic: 'SGD',
            },
          } as Account,
        ],
      } as SWRResponse,
    );
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 0.7, currency: '' });

    render(<FormWrapper />);

    await user.type(screen.getByTestId('date'), '2023-01-01');

    await user.click(screen.getByLabelText('splits.0.account'));
    await user.click(screen.getByText('path1'));

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

    expect(q0).toBeEnabled();
    expect(v0).toBeEnabled();
    await user.type(q0, '100');

    await waitFor(() => expect(q0).toHaveValue(100));
    await waitFor(() => expect(v0).toHaveValue(70));
    expect(mockGetPrice).toHaveBeenCalledWith('SGDEUR=X', DateTime.fromISO('2023-01-01'));
  });

  it('sets value * exchangeRate when quantity changes and currency is not txCurrency, investment', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: [
          {
            guid: 'account_guid_1',
            path: 'path1',
            type: 'STOCK',
            commodity: {
              guid: 'googl',
              mnemonic: 'GOOGL',
            },
          } as Account,
        ],
      } as SWRResponse,
    );
    const mockGetPrice = jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValue({ price: 89.12, currency: 'USD' });
    render(<FormWrapper />);

    await user.type(screen.getByTestId('date'), '2023-01-01');

    await user.click(screen.getByLabelText('splits.0.account'));
    await user.click(screen.getByText('path1'));

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value' });

    expect(q0).toBeEnabled();
    expect(v0).toBeEnabled();
    await user.type(q0, '100');

    await waitFor(() => expect(q0).toHaveValue(100));
    await waitFor(() => expect(v0).toHaveValue(8912));
    expect(mockGetPrice).toHaveBeenCalledWith('GOOGL', DateTime.fromISO('2023-01-01'));
  });
});

function FormWrapper({ disabled = false }: { disabled?: boolean }): JSX.Element {
  const form = useForm<FormValues>({
    // These values reproduce the same initial state TransactionForm renders
    defaultValues: {
      splits: [
        {
          value: 0,
          quantity: 0,
          account: {
            guid: 'account_guid_1',
            path: 'path1',
            type: 'ASSET',
            commodity: {
              guid: 'eur',
              mnemonic: 'EUR',
            } as Commodity,
          } as Account,
        },
        {
          value: 0,
          quantity: 0,
          account: {
            guid: 'account_guid_2',
            path: 'path2',
            type: 'EXPENSE',
            commodity: {
              guid: 'eur',
              mnemonic: 'EUR',
            } as Commodity,
          } as Account,
        },
      ],
      fk_currency: {
        guid: 'eur',
        mnemonic: 'EUR',
      },
    },
  });

  return (
    <>
      <input
        id="dateInput"
        data-testid="date"
        className="block w-full m-0"
        {...form.register('date')}
        type="date"
      />
      <SplitField index={0} form={form} disabled={disabled} />
      <SplitField index={1} form={form} disabled={disabled} />
    </>
  );
}
