import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import Modal from 'react-modal';

import ImportButton from '@/components/buttons/ImportButton';

jest.mock('react-modal', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="Modal">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/buttons/import/DBImportButton', () => jest.fn(
  () => <div data-testid="DBImportButton" />,
));

describe('ImportButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders hidden modal on mount', async () => {
    const { container } = render(<ImportButton />);

    expect(Modal).toBeCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );

    expect(container).toMatchSnapshot();
  });

  it('opens modal when clicking the button', async () => {
    render(<ImportButton />);

    const button = await screen.findByRole('button', { name: 'Import' });
    fireEvent.click(button);

    const modal = await screen.findByTestId('Modal');
    expect(Modal).toBeCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
      {},
    );
    expect(modal).toMatchSnapshot();
  });

  it('closes modal when clicking the X button', async () => {
    render(<ImportButton />);

    const button = await screen.findByRole('button', { name: 'Import' });
    fireEvent.click(button);

    await screen.findByTestId('Modal');

    const xButton = screen.getByRole('button', { name: 'X' });
    fireEvent.click(xButton);

    expect(Modal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      {},
    );
  });
});
