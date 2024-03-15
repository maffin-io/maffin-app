import React from 'react';
import { render, screen } from '@testing-library/react';

import AccountsLayout from '@/app/dashboard/accounts/layout';

describe('AccountsLayout', () => {
  it('renders as expected', () => {
    render(<AccountsLayout><span>hello</span></AccountsLayout>);

    screen.getByText('hello');
  });
});
