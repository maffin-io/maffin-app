import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import Modal from 'react-modal';

import AddAccountButton from '@/components/buttons/AddAccountButton';
import AccountForm from '@/components/forms/account/AccountForm';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';

jest.mock('react-modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/account/AccountForm', () => jest.fn(
  () => <div data-testid="AccountForm" />,
).mockName('AccountForm'));
const AccountFormMock = AccountForm as jest.MockedFunction<typeof AccountForm>;

describe('AddAccountButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders hidden modal on mount', async () => {
    render(<AddAccountButton />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(AccountForm).toHaveBeenLastCalledWith(
      {
        onSave: expect.any(Function),
      },
      {},
    );
  });

  it('opens modal when clicking the button', async () => {
    render(
      <AddAccountButton />,
    );

    const button = await screen.findByRole('button', { name: /add account/i });
    fireEvent.click(button);

    const modal = await screen.findByTestId('Modal');
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
      {},
    );
    expect(modal).toMatchSnapshot();
  });

  it('closes modal when clicking the X button', async () => {
    render(
      <AddAccountButton />,
    );

    const button = await screen.findByRole('button', { name: /add account/i });
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

  it('on form save closes modal and saves', async () => {
    const mockSave = jest.fn();
    render(
      <DataSourceContext.Provider value={{ save: mockSave as Function } as DataSourceContextType}>
        <AddAccountButton />
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add account/i });
    fireEvent.click(button);

    const { onSave } = AccountFormMock.mock.calls[0][0];
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
