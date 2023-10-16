import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import Modal from 'react-modal';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';
import { DateTime } from 'luxon';
import type { FormValues } from '@/components/forms/transaction/types';

jest.mock('react-modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/transaction/TransactionForm', () => jest.fn(
  () => <div data-testid="TransactionForm" />,
).mockName('TransactionForm'));
const TransactionFormMock = TransactionForm as jest.MockedFunction<typeof TransactionForm>;

describe('TransactionFormButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected by default', async () => {
    const { container } = render(
      <TransactionFormButton
        defaultValues={{} as FormValues}
        account={{
          guid: '1',
          name: 'account',
        } as Account}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('can pass children to render alternative button text', async () => {
    render(
      <TransactionFormButton
        defaultValues={{} as FormValues}
        account={{
          guid: '1',
          name: 'account',
        } as Account}
      >
        <span>Update</span>
      </TransactionFormButton>,
    );

    screen.getByText('Update');
  });

  it.each([
    'add',
    'update',
    'delete',
  ])('renders hidden modal with TransactionForm on mount with action %s', async (action) => {
    render(
      <TransactionFormButton
        defaultValues={{} as FormValues}
        account={{
          guid: '1',
          name: 'account',
        } as Account}
        action={action as 'add' | 'update' | 'delete'}
      />,
    );
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(TransactionForm).toHaveBeenLastCalledWith(
      {
        action,
        defaultValues: {},
        onSave: expect.any(Function),
      },
      {},
    );
  });

  it('opens modal when clicking the button', async () => {
    render(
      <TransactionFormButton
        defaultValues={{} as FormValues}
        account={{
          guid: '1',
          name: 'account',
        } as Account}
      />,
    );

    const button = await screen.findByRole('button', { name: /add transaction/i });
    fireEvent.click(button);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
      {},
    );
  });

  it('closes modal when clicking the X button', async () => {
    render(
      <TransactionFormButton
        defaultValues={{} as FormValues}
        account={{
          guid: '1',
          name: 'account',
        } as Account}
      />,
    );

    const button = await screen.findByRole('button', { name: /add transaction/i });
    fireEvent.click(button);

    await screen.findByTestId('Modal');
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
      {},
    );

    const xButton = screen.getByRole('button', { name: 'X' });
    fireEvent.click(xButton);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );
  });

  it.each(
    ['update', 'delete'],
  )('retrieves original Transaction when %s', async (action) => {
    const split1 = new Split();
    split1.value = -10;
    split1.quantity = -10;
    const split2 = new Split();
    split2.value = 10;
    split2.quantity = 10;

    jest.spyOn(Transaction, 'findOneOrFail').mockResolvedValue({
      guid: 'guid',
      date: DateTime.fromISO('2023-01-01'),
      currency: {
        mnemonic: 'EUR',
      },
      splits: [split1, split2],
    } as Transaction);
    render(
      <TransactionFormButton
        defaultValues={{
          guid: 'guid',
          date: '2023-01-01',
        } as FormValues}
        action={action as 'update' | 'delete'}
      />,
    );

    const button = await screen.findByRole('button', { name: /add transaction/i });
    fireEvent.click(button);

    expect(Transaction.findOneOrFail).toHaveBeenCalledWith({
      where: { guid: 'guid' },
      relations: { splits: { fk_account: true } },
    });

    await waitFor(() => {
      expect(TransactionForm).toHaveBeenLastCalledWith(
        {
          action,
          defaultValues: {
            guid: 'guid',
            date: '2023-01-01',
            fk_currency: {
              mnemonic: 'EUR',
            },
            splits: [
              expect.objectContaining({
                quantity: -10,
                quantityDenom: 1,
                quantityNum: -10,
                value: -10,
                valueNum: -10,
                valueDenom: 1,
              }),
              expect.objectContaining({
                quantity: 10,
                quantityDenom: 1,
                quantityNum: 10,
                value: 10,
                valueNum: 10,
                valueDenom: 1,
              }),
            ],
          },
          onSave: expect.any(Function),
        },
        {},
      );
    });
  });

  it('passes expected data to TransactionForm', async () => {
    const mockSave = jest.fn();
    const defaultValues = {
      date: '',
      description: '',
      fk_currency: {} as Commodity,
    };

    render(
      <DataSourceContext.Provider value={{ save: mockSave as Function } as DataSourceContextType}>
        <TransactionFormButton
          account={{
            guid: '1',
          } as Account}
          defaultValues={{
            ...defaultValues,
            splits: [],
          }}
        />
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add transaction/i });
    fireEvent.click(button);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
      {},
    );
    expect(TransactionForm).toHaveBeenLastCalledWith(
      {
        action: 'add',
        defaultValues: {
          ...defaultValues,
          splits: [
            {
              action: '',
              guid: expect.any(String),
              fk_account: { guid: '1' },
            },
            {
              action: '',
              guid: expect.any(String),
            },
          ],
        },
        onSave: expect.any(Function),
      },
      {},
    );

    const { onSave } = TransactionFormMock.mock.calls[0][0];
    act(() => onSave());
    expect(mockSave).toBeCalledTimes(1);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );
  });
});
