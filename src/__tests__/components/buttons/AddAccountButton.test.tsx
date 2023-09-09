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
        className: 'relative top-20 mx-auto p-5 w-1/3 shadow-lg rounded-md bg-gunmetal-700',
        overlayClassName: 'fixed inset-0 bg-white bg-opacity-30 overflow-y-auto h-full w-full z-50',
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
        isOpen: true,
        className: 'relative top-20 mx-auto p-5 w-1/3 shadow-lg rounded-md bg-gunmetal-700',
        overlayClassName: 'fixed inset-0 bg-white bg-opacity-30 overflow-y-auto h-full w-full z-50',
      }),
      {},
    );

    const { onSave } = AccountFormMock.mock.calls[0][0];
    act(() => onSave());
    expect(mockSave).toBeCalledTimes(1);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
        className: 'relative top-20 mx-auto p-5 w-1/3 shadow-lg rounded-md bg-gunmetal-700',
        overlayClassName: 'fixed inset-0 bg-white bg-opacity-30 overflow-y-auto h-full w-full z-50',
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
