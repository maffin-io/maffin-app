import React from 'react';
import { userEvent } from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import { Tooltip } from '@/components/tooltips';

describe('Tooltip', () => {
  it('renders as expected', async () => {
    const { container } = render(
      <>
        <span data-tooltip-id="tooltip">
          hello
        </span>
        <Tooltip id="tooltip" className="class">
          text
        </Tooltip>
      </>,
    );

    const e = screen.getByText('hello');
    await userEvent.hover(e);

    const tooltip = await screen.findByRole('tooltip');

    expect(tooltip).toHaveClass('class');
    expect(container).toMatchSnapshot();
  });
});
