import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
} from '@testing-library/react';

import AddAccountButton from '@/components/buttons/AddAccountButton';
import AccountForm from '@/components/forms/account/AccountForm';
import Modal from '@/components/Modal';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';

jest.mock('@/components/Modal', () => jest.fn(
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
        open: false,
        setOpen: expect.any(Function),
        title: 'Add account',
      }),
      {},
    );

    const { children } = (Modal as jest.Mock).mock.calls[0][0];
    // @ts-ignore
    expect(children.type.getMockName()).toEqual('AccountForm');
    expect(AccountForm).toHaveBeenLastCalledWith(
      {
        onSave: expect.any(Function),
      },
      {},
    );
  });

  it('closes modal and saves', async () => {
    const mockSave = jest.fn();
    render(
      <DataSourceContext.Provider value={{ save: mockSave as Function } as DataSourceContextType}>
        <AddAccountButton />
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add account/i });
    fireEvent.click(button);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        setOpen: expect.any(Function),
        title: 'Add account',
      }),
      {},
    );

    const { onSave } = AccountFormMock.mock.calls[0][0];
    act(() => onSave());
    expect(mockSave).toBeCalledTimes(1);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: false,
        setOpen: expect.any(Function),
        title: 'Add account',
      }),
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
    expect(modal).toMatchSnapshot();
  });
});
