import React from 'react';
import { render, screen } from '@testing-library/react';

import InvestmentsLayout from '@/app/dashboard/investments/layout';

describe('InvestmentsLayout', () => {
  it('renders as expected', () => {
    render(<InvestmentsLayout><span>hello</span></InvestmentsLayout>);

    screen.getByText('hello');
  });
});
