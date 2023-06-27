import React from 'react';
import { render } from '@testing-library/react';

import type { AccountSelectorProps } from '@/components/AccountSelector';
import Topbar from '@/layout/Topbar';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');

jest.mock('@/components/ProfileDropdown', () => {
  function ProfileDropdown() {
    return (
      <div className="ProfileDropdown" />
    );
  }

  return ProfileDropdown;
});

jest.mock('@/components/AccountSelector', () => {
  function AccountSelector({ id, placeholder, onChange }: AccountSelectorProps) {
    // call onChange to verify it's functionality
    onChange!({ guid: '123' });
    return (
      <div className="AccountSelector">
        <span>{id}</span>
        <span>{placeholder}</span>
      </div>
    );
  }

  return AccountSelector;
});

describe('Topbar', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockRouterPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockRouterPush,
    }));
  });

  it('renders as expected', () => {
    const { container } = render(<Topbar />);

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/accounts/123');
    expect(container).toMatchSnapshot();
  });
});
