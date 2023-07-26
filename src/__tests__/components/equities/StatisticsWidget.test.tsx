import React from 'react';
import { render } from '@testing-library/react';

import StatisticsWidget from '@/components/StatisticsWidget';

describe('StatisticsWidget', () => {
  it('renders as expected', () => {
    const { container } = render(
      <StatisticsWidget
        statsTextClass="mdi text-success"
        bgclassName="dark"
        icon="mdi mdi-cash-multiple"
        description="Description"
        title="Title"
        stats="1234$"
        trend={{
          textClass: 'text-success',
          value: '1234.56',
          time: 'trend',
        }}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders as expected without optional params', () => {
    const { container } = render(
      <StatisticsWidget
        description="Description"
        title="Title"
        stats="1234$"
        trend={{
          textClass: 'text-success',
          value: '1234.56',
          time: 'trend',
        }}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
