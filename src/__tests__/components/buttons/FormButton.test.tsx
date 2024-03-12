import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import Modal from 'react-modal';
import { BiPlusCircle } from 'react-icons/bi';

import FormButton from '@/components/buttons/FormButton';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';

jest.mock('react-modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));

describe('FormButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders hidden modal on mount', async () => {
    const mockClone = jest.spyOn(React, 'cloneElement');
    const c = <TestComponent />;
    const { container } = render(
      <FormButton
        modalTitle="Add"
        buttonContent={(
          <>
            <BiPlusCircle className="mr-1" />
            New
          </>
        )}
      >
        {c}
      </FormButton>,
    );

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(mockClone).toBeCalledWith(c, { onSave: expect.any(Function) });
    expect(container).toMatchSnapshot();
  });

  it('opens modal when clicking the button', async () => {
    render(
      <FormButton
        modalTitle="Add"
        buttonContent={(
          <>
            <BiPlusCircle className="mr-1" />
            New
          </>
        )}
      >
        <TestComponent />
      </FormButton>,
    );

    const button = await screen.findByRole('button', { name: /new/i });
    fireEvent.click(button);

    await screen.findByText('submit form');
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
      <FormButton
        modalTitle="Add"
        buttonContent={(
          <>
            <BiPlusCircle className="mr-1" />
            New
          </>
        )}
      >
        <TestComponent />
      </FormButton>,
    );

    const button = await screen.findByRole('button', { name: /new/i });
    fireEvent.click(button);

    await screen.findByText('submit form');
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
    const mockSave = jest.fn(() => Promise.resolve());
    render(
      <DataSourceContext.Provider value={{ save: mockSave as Function } as DataSourceContextType}>
        <FormButton
          modalTitle="Add"
          buttonContent={(
            <>
              <BiPlusCircle className="mr-1" />
              New
            </>
          )}
        >
          <TestComponent />
        </FormButton>
      </DataSourceContext.Provider>,
    );

    // open modal to prove that onSave closes it
    const button = await screen.findByRole('button', { name: /new/i });
    fireEvent.click(button);

    fireEvent.click(screen.getByText('submit form'));
    expect(mockSave).toBeCalledTimes(1);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );
  });
});

function TestComponent({
  onSave = () => {},
}: {
  onSave?: Function,
}): JSX.Element {
  return <button onClick={() => onSave()} type="button">submit form</button>;
}
