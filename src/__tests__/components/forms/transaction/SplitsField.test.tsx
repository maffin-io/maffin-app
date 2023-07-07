import React from 'react';
import { useForm } from 'react-hook-form';
import { DataSource } from 'typeorm';
import userEvent from '@testing-library/user-event';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import crypto from 'crypto';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import SplitsField from '@/components/forms/transaction/SplitsField';
import type { FormValues } from '@/components/forms/transaction/types';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe('SplitsField', () => {
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
    await datasource.destroy();
  });

  it('renders SplitField', async () => {
    const { container } = render(<FormWrapper />);

    await screen.findByRole('combobox', { name: 'splits.0.account' });
    await screen.findByRole('combobox', { name: 'splits.1.account' });
    expect(screen.getAllByRole('spinbutton', { hidden: true })).toHaveLength(4);
    screen.getByText('Add split');

    expect(container).toMatchSnapshot();
  });

  it('can remove for N > 2 split fields', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    await user.click(screen.getByText('Add split'));

    screen.getByRole('combobox', { name: 'splits.0.account' });
    screen.getByRole('combobox', { name: 'splits.1.account' });
    screen.getByRole('combobox', { name: 'splits.2.account' });
    expect(screen.getAllByRole('spinbutton', { hidden: true })).toHaveLength(6);

    const removeButton = screen.getByText('X', { selector: 'button' });
    await user.click(removeButton);

    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.getAllByRole('spinbutton', { hidden: true })).toHaveLength(4);
  });

  it('sets quantity for split2 when two splits with same currency', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);
    await user.type(screen.getByTestId('date'), '2023-01-01');

    const q0 = screen.getByRole('spinbutton', { name: 'splits.0.quantity' });
    expect(q0).toBeEnabled();

    await user.type(q0, '100');
    const v0 = screen.getByRole('spinbutton', { name: 'splits.0.value', hidden: true });
    await waitFor(() => expect(v0).toHaveValue(100));

    const q1 = screen.getByRole('spinbutton', { name: 'splits.1.quantity' });
    const v1 = screen.getByRole('spinbutton', { name: 'splits.1.value', hidden: true });
    await waitFor(() => expect(q1).toHaveValue(-100));
    await waitFor(() => expect(v1).toHaveValue(-100));
  });
});

function FormWrapper(): JSX.Element {
  const form = useForm<FormValues>({
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
    <form onSubmit={form.handleSubmit(() => {})}>
      <input
        id="dateInput"
        data-testid="date"
        className="block w-full m-0"
        {...form.register('date')}
        type="date"
      />
      <SplitsField form={form} />
    </form>
  );
}
