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
import type { UseDataSourceReturn } from '@/hooks';
import * as dataSourceHooks from '@/hooks/useDataSource';

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

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

describe('AddAccountButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders hidden modal on mount', async () => {
    render(
      <AddAccountButton />,
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
  });

  it('closes modal and saves', async () => {
    const mockSave = jest.fn();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { save: mockSave as Function } as UseDataSourceReturn,
    );

    render(<AddAccountButton />);

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
