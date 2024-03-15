import React from 'react';
import { render, screen } from '@testing-library/react';

import CommodityLayout from '@/app/dashboard/commodities/[guid]/layout';

describe('CommodityLayout', () => {
  it('renders as expected', () => {
    render(<CommodityLayout><span>hello</span></CommodityLayout>);

    screen.getByText('hello');
  });
});
