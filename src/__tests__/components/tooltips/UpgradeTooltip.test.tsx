import React from 'react';
import { userEvent } from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import { UpgradeTooltip } from '@/components/tooltips';

describe('UpgradeTooltip', () => {
  it('renders as expected', async () => {
    const { container } = render(
      <>
        <span data-tooltip-id="upgrade-tooltip">
          upgrade
        </span>
        <UpgradeTooltip id="upgrade-tooltip" message="message" />
      </>,
    );

    const e = screen.getByText('upgrade');
    await userEvent.hover(e);

    await screen.findByRole('tooltip');
    expect(container).toMatchSnapshot();
  });
});
