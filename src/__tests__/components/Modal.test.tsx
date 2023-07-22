import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Modal from '@/components/Modal';

describe('Modal', () => {
  it('returns span if not open', () => {
    const { container } = render(
      <Modal
        open={false}
        setOpen={() => {}}
      >
        <div />
      </Modal>,
    );

    expect(container.innerHTML).toEqual('<span></span>');
  });

  it('renders as expected', () => {
    const { container } = render(
      <Modal
        title="title"
        open
        setOpen={() => {}}
      >
        <div />
      </Modal>,
    );

    expect(container).toMatchSnapshot();
  });

  it('calls setOpen on close', async () => {
    const user = userEvent.setup();
    const mockSetOpen = jest.fn();
    render(
      <Modal
        title="title"
        open
        setOpen={mockSetOpen}
      >
        <div />
      </Modal>,
    );

    screen.getByText('title');
    await user.click(screen.getByText('X'));

    expect(mockSetOpen).toBeCalledTimes(1);
    expect(mockSetOpen).toBeCalledWith(false);
  });
});
