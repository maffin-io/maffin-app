import React from 'react';
import {
  waitFor,
  render,
  screen,
  fireEvent,
} from '@testing-library/react';

import { Account } from '@/book/entities';
import AddTransactionButton from '@/components/AddTransactionButton';
import type { TransactionFormProps } from '@/components/forms/transaction/TransactionForm';
import type { ModalProps } from '@/components/Modal';

jest.mock('@/components/Modal', () => {
  function Modal(props: ModalProps) {
    return (
      <div data-testid="modal" className="Modal">
        <span>{props.setOpen.name}</span>
        <span>{`open: ${props.open}`}</span>
        <span>{props.title}</span>
        {props.children}
      </div>
    );
  }

  return Modal;
});

jest.mock('@/components/forms/transaction/TransactionForm', () => {
  function TransactionForm(props: TransactionFormProps) {
    return (
      <div className="TransactionForm">
        <span>{props.onSave.name}</span>
        <span>{JSON.stringify(props.account)}</span>
      </div>
    );
  }

  return TransactionForm;
});

describe('AddTransactionButton', () => {
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
    fireEvent.focus(button);

    fireEvent.click(button);
    await waitFor(() => {
      screen.getByTestId('modal');
    });

    expect(screen.getByTestId('modal')).toMatchSnapshot();
  });
});
