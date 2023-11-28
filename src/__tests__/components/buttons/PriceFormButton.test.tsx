import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import Modal from 'react-modal';

import { DataSourceContext } from '@/hooks';
import PriceFormButton from '@/components/buttons/PriceFormButton';
import PriceForm from '@/components/forms/price/PriceForm';
import type { DataSourceContextType } from '@/hooks';

jest.mock('react-modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/price/PriceForm', () => jest.fn(
  () => <div data-testid="PriceForm" />,
).mockName('PriceForm'));

describe('PriceFormButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders hidden modal on mount', async () => {
    render(<PriceFormButton />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(PriceForm).toHaveBeenLastCalledWith(
      {
        action: 'add',
        onSave: expect.any(Function),
        defaultValues: undefined,
        hideDefaults: true,
      },
      {},
    );
  });

  it('renders hidden modal on mount with update', async () => {
    render(<PriceFormButton action="update" />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(PriceForm).toHaveBeenLastCalledWith(
      {
        action: 'update',
        onSave: expect.any(Function),
        defaultValues: undefined,
        hideDefaults: true,
      },
      {},
    );
  });

  it('renders hidden modal on mount with delete', async () => {
    render(<PriceFormButton action="delete" />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(PriceForm).toHaveBeenLastCalledWith(
      {
        action: 'delete',
        onSave: expect.any(Function),
        defaultValues: undefined,
        hideDefaults: true,
      },
      {},
    );
  });

  it('opens modal when clicking the button', async () => {
    render(
      <PriceFormButton />,
    );

    const button = await screen.findByRole('button', { name: /add price/i });
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
      <PriceFormButton />,
    );

    const button = await screen.findByRole('button', { name: /add price/i });
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
        <PriceFormButton />
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add price/i });
    fireEvent.click(button);

    const { onSave } = (PriceForm as jest.Mock).mock.calls[0][0];
    act(() => onSave());
    expect(mockSave).toBeCalledTimes(1);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );
  });

  it('passes values to PriceForm', async () => {
    const mockSave = jest.fn();
    render(
      <DataSourceContext.Provider value={{ save: mockSave as Function } as DataSourceContextType}>
        <PriceFormButton
          defaultValues={{
            value: 100,
          }}
        />
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add price/i });
    fireEvent.click(button);

    expect(PriceForm as jest.Mock).toBeCalledWith(
      {
        action: 'add',
        onSave: expect.any(Function),
        defaultValues: {
          value: 100,
        },
        hideDefaults: true,
      },
      {},
    );
  });

  it('renders the children', async () => {
    render(
      <PriceFormButton>
        <span>hello</span>
      </PriceFormButton>,
    );

    await screen.findByText('hello');
  });
});
