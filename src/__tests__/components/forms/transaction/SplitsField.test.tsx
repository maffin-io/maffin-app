import React from 'react';
import { useForm } from 'react-hook-form';
import { DataSource } from 'typeorm';
import userEvent from '@testing-library/user-event';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import SplitsField from '@/components/forms/transaction/SplitsField';
import * as queries from '@/lib/queries';
import * as apiHook from '@/hooks/api';
import type { FormValues } from '@/components/forms/transaction/types';

jest.mock('@/lib/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/queries'),
}));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('SplitsField', () => {
  let datasource: DataSource;
  beforeEach(async () => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: undefined,
      } as UseQueryResult<Account[]>,
    );
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Split, Transaction, Price],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  it('renders with default values', async () => {
    const { container } = render(<FormWrapper />);

    await screen.findByRole('combobox', { name: 'splits.1.account' });
    expect(screen.getAllByRole('spinbutton', { hidden: true })).toHaveLength(4);
    screen.getByText('Add split');

    expect(container).toMatchSnapshot();
  });

  it('renders as expected when disabled', async () => {
    render(<FormWrapper disabled />);

    expect(await screen.findByLabelText('splits.1.account')).toBeDisabled();
    expect(screen.queryByText('Add split')).toBeNull();
  });

  it('autocompletes value and quantity for split2 when only 2 splits', async () => {
    const user = userEvent.setup();
    const eur = {
      guid: 'eur',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;
    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(eur);

    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: [
          {
            guid: 'account_guid_1',
            path: 'path1',
            type: 'ASSET',
            commodity: eur,
          } as Account,
        ],
      } as UseQueryResult<Account[]>,
    );

    render(<FormWrapper />);

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    expect(q0).toBeEnabled();

    await user.type(q0, '100');
    const v0 = screen.getByRole('spinbutton', { name: '', hidden: true });
    await waitFor(() => expect(v0).toHaveValue(100));

    await user.click(screen.getByLabelText('splits.1.account'));
    await user.click(screen.getByText('path1'));

    const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });
    await waitFor(() => expect(v1).toHaveValue(-100));
    await waitFor(() => expect(q1).toHaveValue(-100));
  });

  it('can remove for N > 2 split fields', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    await user.click(screen.getByText('Add split'));

    screen.getByRole('combobox', { name: 'splits.1.account' });
    screen.getByRole('combobox', { name: 'splits.2.account' });
    expect(screen.getAllByRole('spinbutton', { hidden: true })).toHaveLength(6);

    const removeButton = screen.getByText('X', { selector: 'button' });
    await user.click(removeButton);

    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    expect(screen.getAllByRole('spinbutton', { hidden: true })).toHaveLength(4);
  });
});

function FormWrapper({ disabled = false }: { disabled?: boolean }): JSX.Element {
  const account = {
    guid: 'account_guid_1',
    path: 'path1',
    type: 'ASSET',
    commodity: {
      guid: 'eur',
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity,
  } as Account;

  const form = useForm<FormValues>({
    defaultValues: {
      splits: [
        {
          value: 0,
          quantity: 0,
          fk_account: account,
          account,
        },
        {},
      ],
      fk_currency: {
        guid: 'eur',
        mnemonic: 'EUR',
        namespace: 'CURRENCY',
      },
    },
  });

  return (
    <form onSubmit={form.handleSubmit(() => {})}>
      <input
        id="dateInput"
        data-testid="date"
        className="block w-full m-0"
        {...form.register('date')}
        type="date"
      />
      <SplitsField form={form} disabled={disabled} />
    </form>
  );
}
