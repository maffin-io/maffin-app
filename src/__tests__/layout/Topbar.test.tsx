import React from 'react';
import { render } from '@testing-library/react';
import * as navigation from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import Topbar from '@/layout/Topbar';
import { AccountSelector } from '@/components/selectors';
import SaveButton from '@/components/buttons/SaveButton';
import ProfileDropdown from '@/components/ProfileDropdown';
import ThemeButton from '@/components/buttons/ThemeButton';
import DateRangeInput from '@/components/DateRangeInput';

jest.mock('next/navigation');

jest.mock('@/components/ProfileDropdown', () => jest.fn(
  () => <div data-testid="ProfileDropdown" />,
));

jest.mock('@/components/DateRangeInput', () => jest.fn(
  () => <div data-testid="DateRangeInput" />,
));

jest.mock('@/components/buttons/SaveButton', () => jest.fn(
  () => <div data-testid="SaveButton" />,
));

jest.mock('@/components/selectors/AccountSelector', () => jest.fn(
  () => <div data-testid="accountSelector" />,
));

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

    expect(ProfileDropdown).toHaveBeenLastCalledWith({}, {});
    expect(DateRangeInput).toBeCalledWith({}, {});
    expect(SaveButton).toHaveBeenLastCalledWith({}, {});
    expect(ThemeButton).toHaveBeenLastCalledWith({}, {});
    expect(AccountSelector).toHaveBeenLastCalledWith(
      {
        id: 'globalSearch',
        className: 'py-5 pl-1',
        onChange: expect.any(Function),
        placeholder: 'Search (cmd + k)...',
        ignoreHidden: false,
      },
      {},
    );
    const { onChange } = (AccountSelector as jest.Mock).mock.calls[0][0];
    onChange({ guid: '123' });
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/accounts/123');
    expect(container).toMatchSnapshot();
  });
});
