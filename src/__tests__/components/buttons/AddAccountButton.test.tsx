import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';

import AddAccountButton from '@/components/buttons/AddAccountButton';
import AccountForm from '@/components/forms/account/AccountForm';
import Modal from '@/components/Modal';

jest.mock('@/components/Modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));
const ModalMock = Modal as jest.MockedFunction<typeof Modal>;

jest.mock('@/components/forms/account/AccountForm', () => jest.fn(
  () => <div data-testid="AccountForm" />,
).mockName('AccountForm'));
const AccountFormMock = AccountForm as jest.MockedFunction<typeof AccountForm>;

describe('AddAccountButton', () => {
  it('renders hidden modal on mount', async () => {
    const mockOnSave = jest.fn();
    render(
      <AddAccountButton
        onSave={mockOnSave}
      />,
    );
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: false,
        setOpen: expect.any(Function),
        title: 'Add account',
      }),
      {},
    );

    const { children } = ModalMock.mock.calls[0][0];
    // @ts-ignore
    expect(children.type.getMockName()).toEqual('AccountForm');
    expect(AccountForm).toHaveBeenLastCalledWith(
      {
        onSave: expect.any(Function),
      },
      {},
    );
    const { onSave } = AccountFormMock.mock.calls[0][0];
    expect(mockOnSave).toBeCalledTimes(0);
    if (onSave) {
      onSave();
    }
    expect(mockOnSave).toBeCalledWith();
  });

  it('opens modal when clicking the button', async () => {
    render(
      <AddAccountButton
        onSave={jest.fn()}
      />,
    );

    const button = await screen.findByRole('button', { name: /add account/i });
    fireEvent.click(button);

    const modal = await screen.findByTestId('Modal');
    expect(modal).toMatchSnapshot();
  });
});
