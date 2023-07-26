import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import * as swr from 'swr';

import type { Commodity, Split } from '@/book/entities';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import Modal from '@/components/Modal';
import type { UseDataSourceReturn } from '@/hooks';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('swr');

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

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

describe('TransactionFormButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected by default', async () => {
    const { container } = render(
      <TransactionFormButton />,
    );

    expect(container).toMatchSnapshot();
  });

  it('can pass children to render alternative button text', async () => {
    render(
      <TransactionFormButton>
        <span>Update</span>
      </TransactionFormButton>,
    );

    screen.getByText('Update');
  });

  it.each([
    ['add', 'Add transaction'],
    ['update', 'Edit transaction'],
    ['delete', 'Confirm you want to remove this transaction'],
  ])('renders hidden modal with TransactionForm on mount with action %s', async (action, title) => {
    render(<TransactionFormButton action={action as 'add' | 'update' | 'delete'} />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: false,
        setOpen: expect.any(Function),
        title,
      }),
      {},
    );

    const { children } = ModalMock.mock.calls[0][0];
    // @ts-ignore
    expect(children.type.getMockName()).toEqual('TransactionForm');
    expect(TransactionForm).toHaveBeenLastCalledWith(
      {
        action,
        defaultValues: undefined,
        onSave: expect.any(Function),
      },
      {},
    );
  });

  it('opens modal when clicking the button', async () => {
    render(<TransactionFormButton />);

    const button = await screen.findByRole('button', { name: /add transaction/i });
    fireEvent.click(button);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        setOpen: expect.any(Function),
        title: 'Add transaction',
      }),
      {},
    );
  });

  it('passes expected onSave to TransactionForm', async () => {
    const mockSave = jest.fn();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { save: mockSave as Function } as UseDataSourceReturn,
    );
    const defaultValues = {
      date: '',
      description: '',
      fk_currency: {} as Commodity,
      splits: [
        { guid: '1', account: { guid: '1' } } as Split,
        { guid: '2', account: { guid: '2' } } as Split,
      ],
    };

    render(<TransactionFormButton defaultValues={defaultValues} />);

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add transaction/i });
    fireEvent.click(button);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        setOpen: expect.any(Function),
        title: 'Add transaction',
      }),
      {},
    );

    const { onSave } = TransactionFormMock.mock.calls[0][0];
    act(() => onSave());
    expect(swr.mutate).toBeCalledTimes(2);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, '/api/splits/1');
    expect(swr.mutate).toHaveBeenNthCalledWith(2, '/api/splits/2');
    expect(mockSave).toBeCalledTimes(1);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: false,
        setOpen: expect.any(Function),
        title: 'Add transaction',
      }),
      {},
    );
  });
});
