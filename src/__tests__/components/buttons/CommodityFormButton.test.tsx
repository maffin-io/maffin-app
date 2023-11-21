import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import Modal from 'react-modal';

import CommodityFormButton from '@/components/buttons/CommodityFormButton';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';

jest.mock('react-modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/commodity/CommodityForm', () => jest.fn(
  () => <div data-testid="CommodityForm" />,
).mockName('CommodityForm'));

describe('CommodityFormButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders hidden modal on mount', async () => {
    render(<CommodityFormButton />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(CommodityForm).toHaveBeenLastCalledWith(
      {
        action: 'add',
        onSave: expect.any(Function),
        defaultValues: undefined,
      },
      {},
    );
  });

  it('renders hidden modal on mount with update', async () => {
    render(<CommodityFormButton action="update" />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(CommodityForm).toHaveBeenLastCalledWith(
      {
        action: 'update',
        onSave: expect.any(Function),
        defaultValues: undefined,
      },
      {},
    );
  });

  it('renders hidden modal on mount with delete', async () => {
    render(<CommodityFormButton action="delete" />);
    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(CommodityForm).toHaveBeenLastCalledWith(
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
      <CommodityFormButton />,
    );

    const button = await screen.findByRole('button', { name: /add commodity/i });
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
      <CommodityFormButton />,
    );

    const button = await screen.findByRole('button', { name: /add commodity/i });
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
        <CommodityFormButton />
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add commodity/i });
    fireEvent.click(button);

    const { onSave } = (CommodityForm as jest.Mock).mock.calls[0][0];
    act(() => onSave());
    expect(mockSave).toBeCalledTimes(1);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );
  });

  it('passes values to CommodityForm', async () => {
    const mockSave = jest.fn();
    render(
      <DataSourceContext.Provider value={{ save: mockSave as Function } as DataSourceContextType}>
        <CommodityFormButton
          defaultValues={{
            mnemonic: 'EUR',
          }}
        />
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /add commodity/i });
    fireEvent.click(button);

    expect(CommodityForm as jest.Mock).toBeCalledWith(
      {
        action: 'add',
        onSave: expect.any(Function),
        defaultValues: {
          mnemonic: 'EUR',
        },
      },
      {},
    );
  });

  it('renders the children', async () => {
    render(
      <CommodityFormButton>
        <span>hello</span>
      </CommodityFormButton>,
    );

    await screen.findByText('hello');
  });
});
