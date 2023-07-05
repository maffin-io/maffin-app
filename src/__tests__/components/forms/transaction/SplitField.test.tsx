import React from 'react';
import {
  waitFor,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseFieldArrayRemove } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { DataSource } from 'typeorm';

import Stocker from '@/apis/Stocker';
import type { Account, Commodity } from '@/book/entities';
import SplitField from '@/components/forms/transaction/SplitField';
import type { FormValues } from '@/components/forms/transaction/types';
import * as dataSourceHooks from '@/hooks/useDataSource';
import * as queries from '@/book/queries';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

describe('SplitField', () => {
  beforeEach(() => {
    jest.spyOn(Stocker.prototype, 'getPrice').mockResolvedValue({ price: 0.0, currency: '' });
  });

  it('renders with empty data', () => {
    const { container } = render(
      <FormWrapper
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
      />,
    );

    screen.getByText('<account>');
    screen.queryByPlaceholderText('0.0');
    screen.queryByText('$');
    screen.queryByText('X');
    expect(container).toMatchSnapshot();
  });

  it('renders with exchange rate field when currencies are different', async () => {
    const { container } = render(
      <FormWrapper
        toAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
      />,
    );

    screen.getByPlaceholderText('$ -> €');
    expect(container).toMatchSnapshot();
  });

  it('shows fromAccount currency', async () => {
    render(
      <FormWrapper
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
      />,
    );

    screen.getByDisplayValue('$');
  });

  it('can delete split', async () => {
    const user = userEvent.setup();
    const mockRemove = jest.fn();
    render(
      <FormWrapper
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
        mockRemove={mockRemove}
      />,
    );

    await user.click(screen.getByText('X'));

    expect(mockRemove).toHaveBeenCalledWith(1);
  });

  it('shows account options when typing', async () => {
    const user = userEvent.setup();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      {
        guid: '',
        path: 'path1',
        type: '',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: '',
        path: 'path2',
        type: '',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ]);

    render(
      <FormWrapper
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
      />,
    );

    await waitFor(async () => {
      const accountSelector = screen.getByLabelText('splits.1.toAccount');
      await user.click(accountSelector);
    });

    screen.getByText('path1');
    screen.getByText('path2');
  });

  it('shows error when account is empty', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
      />,
    );

    await user.click(screen.getByText('Submit'));
    screen.getByText('Account is required');
  });

  it('shows error if amount is empty', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
      />,
    );

    const amountInput = screen.getByPlaceholderText('0.0');
    user.clear(amountInput);

    await user.click(screen.getByText('Submit'));
    screen.getByText('Amount is required');
  });

  it.each([
    ['INCOME', '0', 'Income amounts must be negative'],
    ['INCOME', '100', 'Income amounts must be negative'],
    ['EXPENSE', '0', 'Expense amounts must be positive'],
    ['EXPENSE', '-100', 'Expense amounts must be positive'],
  ])('shows error for account %s if amount is %s', async (type, amount, message) => {
    const user = userEvent.setup();
    render(
      <FormWrapper
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
        toAccount={
          {
            guid: '',
            path: '',
            type,
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
      />,
    );

    const amountInput = screen.getByPlaceholderText('0.0');
    user.clear(amountInput);
    await user.type(amountInput, amount);

    await user.click(screen.getByText('Submit'));
    screen.getByText(message);
  });

  it('does not show error for other account type', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
        toAccount={
          {
            guid: '',
            path: '',
            type: 'ASSET',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
      />,
    );

    const amountInput = screen.getByPlaceholderText('0.0');
    user.clear(amountInput);
    await user.type(amountInput, '100');
    await user.click(screen.getByText('Submit'));

    expect(screen.queryByText(/.*amounts must be negative/)).toBeNull();

    user.clear(amountInput);
    await user.type(amountInput, '-100');
    await user.click(screen.getByText('Submit'));

    expect(screen.queryByText(/.*amounts must be positive/)).toBeNull();
  });

  it('shows error if exchangeRate is empty when displayed', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper
        toAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
      />,
    );

    const exchangeRateInput = await screen.findByPlaceholderText('$ -> €');
    user.clear(exchangeRateInput);

    await user.click(screen.getByText('Submit'));
    screen.getByText('Exchange rate is required');
  });

  it('shows error if exchangeRate is negative', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper
        toAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
      />,
    );

    const exchangeRateInput = await screen.findByPlaceholderText('$ -> €');
    user.clear(exchangeRateInput);
    await user.type(exchangeRateInput, '-0.978');

    await user.click(screen.getByText('Submit'));
    screen.getByText('Exchange rate must be positive');
  });

  it('autopopulates exchangeRate for non investments', async () => {
    const user = userEvent.setup();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      {
        guid: '',
        path: 'path1',
        type: '',
        commodity: {
          mnemonic: 'SGD',
        } as Commodity,
      } as Account,
    ]);
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValueOnce({ price: 0.987, currency: '' })
      .mockResolvedValue({ price: 0.7, currency: '' });

    render(
      <FormWrapper
        toAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'USD',
            } as Commodity,
          } as Account
        }
      />,
    );

    const exchangeRateInput = await screen.findByPlaceholderText('$ -> €');
    expect(exchangeRateInput).toHaveValue(0.987);
  });

  it('autopopulates exchangeRate with fromAccount being an investment', async () => {
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValueOnce({ price: 17.15, currency: '' });

    render(
      <FormWrapper
        toAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        fromAccount={
          {
            guid: '',
            path: '',
            type: 'STOCK',
            commodity: {
              mnemonic: 'IDVY.AS',
            } as Commodity,
          } as Account
        }
      />,
    );

    const exchangeRateInput = await screen.findByPlaceholderText('IDVY.AS -> €');
    expect(exchangeRateInput).toHaveValue(17.15);
  });

  it('autopopulates exchangeRate with toAccount being an investment', async () => {
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValueOnce({ price: 17.15, currency: '' });

    render(
      <FormWrapper
        toAccount={
          {
            guid: '',
            path: '',
            type: 'STOCK',
            commodity: {
              mnemonic: 'IDVY.AS',
            } as Commodity,
          } as Account
        }
        fromAccount={
          {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
      />,
    );

    const exchangeRateInput = await screen.findByPlaceholderText('€ -> IDVY.AS');
    expect(exchangeRateInput).toHaveValue();
  });

  it('autopopulates exchangeRate with both accounts being an investment', async () => {
    jest.spyOn(Stocker.prototype, 'getPrice')
      .mockResolvedValueOnce({ price: 17.15, currency: '' });

    render(
      <FormWrapper
        toAccount={
          {
            guid: '',
            path: '',
            type: 'STOCK',
            commodity: {
              mnemonic: 'IDVY.AS',
            } as Commodity,
          } as Account
        }
        fromAccount={
          {
            guid: '',
            path: '',
            type: 'STOCK',
            commodity: {
              mnemonic: 'IAG.MC',
            } as Commodity,
          } as Account
        }
      />,
    );

    const exchangeRateInput = await screen.findByPlaceholderText('IAG.MC -> IDVY.AS');
    expect(exchangeRateInput).toHaveValue(0);
  });
});

function FormWrapper(
  {
    toAccount,
    fromAccount,
    mockRemove = jest.fn(),
  }: {
    toAccount?: Account,
    fromAccount: Account,
    mockRemove?: jest.Mock<UseFieldArrayRemove>
  },
): JSX.Element {
  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  return (
    <form onSubmit={handleSubmit(() => {})}>
      <SplitField
        id="id"
        index={1}
        fromAccount={fromAccount}
        date="2023-01-01"
        split={{
          amount: 0.0,
          toAccount: toAccount || {
            guid: '',
            path: '',
            type: '',
            commodity: {
              mnemonic: '',
            },
          } as Account,
        }}
        control={control}
        setValue={setValue}
        remove={mockRemove}
        register={register}
        errors={errors}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
