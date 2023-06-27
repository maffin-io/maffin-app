import React from 'react';
import {
  render,
} from '@testing-library/react';

import AccountsPage from '@/app/dashboard/accounts/page';

jest.mock('@/components/AccountsTable', () => {
  function AccountsTable() {
    return (
      <div className="AccountsTable" />
    );
  }

  return AccountsTable;
});

describe('AccountsPage', () => {
  it('renders as expected', () => {
    const { container } = render(<AccountsPage />);

    expect(container).toMatchSnapshot();
  });
});
