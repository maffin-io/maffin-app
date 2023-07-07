import React from 'react';
import {
  render,
} from '@testing-library/react';
import crypto from 'crypto';

import AccountsPage from '@/app/dashboard/accounts/page';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

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
