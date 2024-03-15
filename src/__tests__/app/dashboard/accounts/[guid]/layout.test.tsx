import React from 'react';
import { render, screen } from '@testing-library/react';

import AccountLayout from '@/app/dashboard/accounts/[guid]/layout';

describe('AccountLayout', () => {
  it('renders as expected', () => {
    render(<AccountLayout><span>hello</span></AccountLayout>);

    screen.getByText('hello');
  });
});
