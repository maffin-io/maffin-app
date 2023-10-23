import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import Modal from 'react-modal';

import AccountFormButton from '@/components/buttons/AccountFormButton';
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

describe('AccountFormButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders hidden modal on mount', async () => {
    render(<AccountFormButton />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(AccountForm).toHaveBeenLastCalledWith(
      {
        action: 'add',
        onSave: expect.any(Function),
        defaultValues: undefined,
      },
      {},
    );
  });

  it('renders hidden modal on mount with update', async () => {
    render(<AccountFormButton action="update" />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(AccountForm).toHaveBeenLastCalledWith(
      {
        action: 'update',
        onSave: expect.any(Function),
        defaultValues: undefined,
      },
      {},
    );
  });

  it('renders hidden modal on mount with delete', async () => {
    render(<AccountFormButton action="delete" />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(AccountForm).toHaveBeenLastCalledWith(
      {
        action: 'delete',
        onSave: expect.any(Function),
        defaultValues: undefined,
      },
      {},
    );
  });

  it('opens modal when clicking the button', async () => {
    render(
      <AccountFormButton />,
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
      <AccountFormButton />,
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
        <AccountFormButton />
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add account/i });
    fireEvent.click(button);

    const { onSave } = (AccountForm as jest.Mock).mock.calls[0][0];
    act(() => onSave());
    expect(mockSave).toBeCalledTimes(1);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );
  });

  it('passes values to AccountForm', async () => {
    const mockSave = jest.fn();
    render(
      <DataSourceContext.Provider value={{ save: mockSave as Function } as DataSourceContextType}>
        <AccountFormButton
          defaultValues={{
            name: 'Test',
            hidden: true,
          }}
        />
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add account/i });
    fireEvent.click(button);

    expect(AccountForm as jest.Mock).toBeCalledWith(
      {
        action: 'add',
        onSave: expect.any(Function),
        defaultValues: {
          hidden: true,
          name: 'Test',
        },
      },
      {},
    );
  });

  it('renders the children', async () => {
    render(
      <AccountFormButton>
        <span>hello</span>
      </AccountFormButton>,
    );

    await screen.findByText('hello');
  });
});
