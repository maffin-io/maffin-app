import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';

import { Account } from '@/book/entities';
import AddTransactionButton from '@/components/AddTransactionButton';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import Modal from '@/components/Modal';

jest.mock('@/components/Modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));
const ModalMock = Modal as jest.MockedFunction<typeof Modal>;

jest.mock('@/components/forms/transaction/TransactionForm', () => jest.fn(
  () => <div data-testid="TransactionForm" />,
).mockName('TransactionForm'));
const TransactionFormMock = TransactionForm as jest.MockedFunction<typeof TransactionForm>;

describe('AddTransactionButton', () => {
  it('renders hidden modal on mount', async () => {
    const mockOnSave = jest.fn();
    render(
      <AddTransactionButton
        onSave={mockOnSave}
        account={
          {
            guid: 'guid',
            path: 'account:path',
          } as Account
        }
      />,
    );
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: false,
        setOpen: expect.any(Function),
        title: 'Add transaction',
      }),
      {},
    );

    const { children } = ModalMock.mock.calls[0][0];
    // @ts-ignore
    expect(children.type.getMockName()).toEqual('TransactionForm');
    expect(TransactionForm).toHaveBeenLastCalledWith(
      {
        account: {
          guid: 'guid',
          path: 'account:path',
        },
        onSave: expect.any(Function),
      },
      {},
    );
    const { onSave } = TransactionFormMock.mock.calls[0][0];
    expect(mockOnSave).toBeCalledTimes(0);
    if (onSave) {
      onSave();
    }
    expect(mockOnSave).toBeCalledWith();
  });

  it('opens modal when clicking the button', async () => {
    render(
      <AddTransactionButton
        onSave={jest.fn()}
        account={
          {
            guid: 'guid',
            path: 'account:path',
          } as Account
        }
      />,
    );

    const button = await screen.findByRole('button', { name: /add transaction/i });
    fireEvent.click(button);

    const modal = await screen.findByTestId('Modal');
    expect(modal).toMatchSnapshot();
  });
});
