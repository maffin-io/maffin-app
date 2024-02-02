import React from 'react';
import { render } from '@testing-library/react';
import * as navigation from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import Topbar from '@/layout/Topbar';
import { AccountSelector } from '@/components/selectors';
import SaveButton from '@/components/buttons/SaveButton';
import ProfileDropdown from '@/components/ProfileDropdown';
import ThemeButton from '@/components/buttons/ThemeButton';

jest.mock('next/navigation');

jest.mock('@/components/ProfileDropdown', () => jest.fn(
  () => <div data-testid="ProfileDropdown" />,
));
const ProfileDropdownMock = ProfileDropdown as jest.MockedFunction<typeof ProfileDropdown>;

jest.mock('@/components/buttons/SaveButton', () => jest.fn(
  () => <div data-testid="SaveButton" />,
));
const SaveButtonMock = SaveButton as jest.MockedFunction<typeof SaveButton>;

jest.mock('@/components/selectors/AccountSelector', () => jest.fn(
  () => <div data-testid="accountSelector" />,
));
const AccountSelectorMock = AccountSelector as jest.MockedFunction<typeof AccountSelector>;

jest.mock('@/components/buttons/ThemeButton', () => jest.fn(
  () => <div data-testid="ThemeButton" />,
));

describe('Topbar', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockRouterPush = jest.fn();
    jest.spyOn(navigation, 'useRouter').mockImplementation(() => ({
      push: mockRouterPush as AppRouterInstance['push'],
    } as AppRouterInstance));
  });

  it('renders as expected', () => {
    const { container } = render(<Topbar />);

    expect(ProfileDropdownMock).toHaveBeenLastCalledWith({}, {});
    expect(SaveButtonMock).toHaveBeenLastCalledWith({}, {});
    expect(ThemeButton).toHaveBeenLastCalledWith({}, {});
    expect(AccountSelectorMock).toHaveBeenLastCalledWith(
      {
        id: 'globalSearch',
        className: 'py-5 pl-1',
        onChange: expect.any(Function),
        placeholder: 'Search (cmd + k)...',
        ignoreHidden: false,
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
