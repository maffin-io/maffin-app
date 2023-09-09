import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import Modal from 'react-modal';

import { Commodity, Split, Transaction } from '@/book/entities';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';
import { DateTime } from 'luxon';

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
      <TransactionFormButton />,
    );

    expect(container).toMatchSnapshot();
  });

  it('can pass children to render alternative button text', async () => {
    render(
      <TransactionFormButton>
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
    render(<TransactionFormButton action={action as 'add' | 'update' | 'delete'} />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
        className: 'relative top-20 mx-auto p-5 w-1/3 shadow-lg rounded-md bg-gunmetal-700',
        overlayClassName: 'fixed inset-0 bg-white bg-opacity-30 overflow-y-auto h-full w-full z-50',
      }),
      {},
    );

    expect(TransactionForm).toHaveBeenLastCalledWith(
      {
        action,
        defaultValues: undefined,
        onSave: expect.any(Function),
      },
      {},
    );
  });

  it('opens modal when clicking the button', async () => {
    render(<TransactionFormButton />);

    const button = await screen.findByRole('button', { name: /add transaction/i });
    fireEvent.click(button);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
        className: 'relative top-20 mx-auto p-5 w-1/3 shadow-lg rounded-md bg-gunmetal-700',
        overlayClassName: 'fixed inset-0 bg-white bg-opacity-30 overflow-y-auto h-full w-full z-50',
      }),
      {},
    );
  });

  it.each(
    ['update', 'delete'],
  )('retrieves original Transaction when %s', async (action) => {
    jest.spyOn(Transaction, 'findOneOrFail').mockResolvedValue({
      guid: 'guid',
      date: DateTime.fromISO('2023-01-01'),
      currency: {
        mnemonic: 'EUR',
      },
    } as Transaction);
    render(
      <TransactionFormButton guid="guid" action={action as 'update' | 'delete'} />,
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
            currency: {
              mnemonic: 'EUR',
            },
            fk_currency: {
              mnemonic: 'EUR',
            },
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
      splits: [
        { guid: '1', account: { guid: '1' } } as Split,
        { guid: '2', account: { guid: '2' } } as Split,
      ],
    };

    render(
      <DataSourceContext.Provider value={{ save: mockSave as Function } as DataSourceContextType}>
        <TransactionFormButton defaultValues={defaultValues} />
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
        defaultValues,
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
