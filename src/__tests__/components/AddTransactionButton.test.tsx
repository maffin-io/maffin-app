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
  function TransactionsTable(props: ModalProps) {
    return (
      <div data-testid="modal" className="Modal">
        <span>{props.setOpen.name}</span>
        <span>{`open: ${props.open}`}</span>
        <span>{props.title}</span>
        {props.children}
      </div>
    );
  }

  return TransactionsTable;
});

jest.mock('@/components/forms/transaction/TransactionForm', () => {
  function TransactionsTable(props: TransactionFormProps) {
    return (
      <div className="TransactionForm">
        <span>{props.onSave.name}</span>
        <span>{JSON.stringify(props.account)}</span>
      </div>
    );
  }

  return TransactionsTable;
});

describe('AddTransactionButton', () => {
  it('opens modal when clicking the button', async () => {
    render(
      <AddTransactionButton
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
    expect(screen.queryByText(/add transactions from accounts/i)).toBeNull();

    fireEvent.click(button);
    await waitFor(() => {
      screen.getByTestId('modal');
    });

    expect(screen.getByTestId('modal')).toMatchSnapshot();
  });

  it.each(
    ['INCOME', 'EXPENSE'],
  )('disables button and shows tooltip when %s', async (type) => {
    render(
      <AddTransactionButton
        account={
          {
            guid: 'guid',
            type,
            path: 'account:path',
          } as Account
        }
      />,
    );

    const button = await screen.findByRole('button', { name: /add transaction/i });
    expect(button).toBeDisabled();

    fireEvent.focus(button);

    await waitFor(() => {
      screen.getByText(/add transactions from accounts/i);
    });

    expect(screen.queryByText(/add transactions from accounts/i)).toBeVisible();
  });
});
