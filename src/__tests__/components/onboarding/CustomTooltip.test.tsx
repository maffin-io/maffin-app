import React from 'react';
import { render, screen } from '@testing-library/react';

import CustomTooltip from '@/components/onboarding/CustomTooltip';

describe('CustomTooltip', () => {
  it('renders as expected', () => {
    const { container } = render(
      <CustomTooltip
        step={{
          content: 'Hello',
        }}
      />,
    );

    screen.getByText('Hello');
    expect(container).toMatchSnapshot();
  });
});
