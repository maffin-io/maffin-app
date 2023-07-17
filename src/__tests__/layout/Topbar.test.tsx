import React from 'react';
import { render } from '@testing-library/react';

import Topbar from '@/layout/Topbar';
import { AccountSelector } from '@/components/selectors';
import SaveButton from '@/components/SaveButton';
import ProfileDropdown from '@/components/ProfileDropdown';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');

jest.mock('@/components/ProfileDropdown', () => jest.fn(
  () => <div data-testid="ProfileDropdown" />,
));
const ProfileDropdownMock = ProfileDropdown as jest.MockedFunction<typeof ProfileDropdown>;

jest.mock('@/components/SaveButton', () => jest.fn(
  () => <div data-testid="SaveButton" />,
));
const SaveButtonMock = SaveButton as jest.MockedFunction<typeof SaveButton>;

jest.mock('@/components/selectors/AccountSelector', () => jest.fn(
  () => <div data-testid="accountSelector" />,
));
const AccountSelectorMock = AccountSelector as jest.MockedFunction<typeof AccountSelector>;

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

    expect(ProfileDropdownMock).toHaveBeenLastCalledWith({}, {});
    expect(SaveButtonMock).toHaveBeenLastCalledWith({}, {});
    expect(AccountSelectorMock).toHaveBeenLastCalledWith(
      {
        id: 'globalSearch',
        className: 'py-5 pl-1',
        onChange: expect.any(Function),
        placeholder: 'Search (cmd + k)...',
      },
      {},
    );
    const { onChange } = AccountSelectorMock.mock.calls[0][0];
    if (onChange) {
      onChange({ guid: '123' });
    }
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/accounts/123');
    expect(container).toMatchSnapshot();
  });
});
