import React from 'react';
import { render, screen } from '@testing-library/react';

import CommoditiesLayout from '@/app/dashboard/commodities/layout';

describe('CommoditiesLayout', () => {
  it('renders as expected', () => {
    render(<CommoditiesLayout><span>hello</span></CommoditiesLayout>);

    screen.getByText('hello');
  });
});
