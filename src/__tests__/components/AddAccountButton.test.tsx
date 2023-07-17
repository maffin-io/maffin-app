import React from 'react';
import {
  waitFor,
  render,
  screen,
  fireEvent,
} from '@testing-library/react';

import AddAccountButton from '@/components/AddAccountButton';
import type { AccountFormProps } from '@/components/forms/account/AccountForm';
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

jest.mock('@/components/forms/account/AccountForm', () => {
  function AccountForm(props: AccountFormProps) {
    return (
      <div className="AccountForm">
        <span>{props.onSave.name}</span>
      </div>
    );
  }

  return AccountForm;
});

describe('AddAccountButton', () => {
  it('opens modal when clicking the button', async () => {
    render(
      <AddAccountButton
        onSave={jest.fn()}
      />,
    );

    const button = await screen.findByRole('button', { name: /add account/i });
    fireEvent.focus(button);

    fireEvent.click(button);
    await waitFor(() => {
      screen.getByTestId('modal');
    });

    expect(screen.getByTestId('modal')).toMatchSnapshot();
  });
});
