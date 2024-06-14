import React from 'react';
import RModal from 'react-modal';
import { fireEvent, render, screen } from '@testing-library/react';

import Modal from '@/components/ui/Modal';

jest.mock('react-modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="RModal">
      {props.children}
    </div>
  ),
));

describe('Modal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders hidden modal on mount with trigger', async () => {
    const { container } = render(
      <Modal
        triggerContent={<span>open</span>}
      >
        <TestComponent />
      </Modal>,
    );

    expect(RModal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(container).toMatchSnapshot();
  });

  it('opens modal when clicking the trigger', async () => {
    render(
      <Modal
        triggerContent={<span>open</span>}
      >
        <TestComponent />
      </Modal>,
    );

    const button = await screen.findByText('open');
    fireEvent.click(button);

    await screen.findByText('submit form');
    const modal = await screen.findByTestId('RModal');
    expect(RModal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
      {},
    );
    expect(modal).toMatchSnapshot();
  });

  it('closes modal when clicking the X button', async () => {
    render(
      <Modal
        triggerContent={<span>open</span>}
        showClose
      >
        <TestComponent />
      </Modal>,
    );

    const button = await screen.findByText('open');
    fireEvent.click(button);

    await screen.findByText('submit form');
    await screen.findByTestId('RModal');
    expect(RModal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
      {},
    );

    const xButton = screen.getByRole('button', { name: 'X' });
    fireEvent.click(xButton);

    expect(RModal).toHaveBeenLastCalledWith(
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
