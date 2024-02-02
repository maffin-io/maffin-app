import React from 'react';
import { render } from '@testing-library/react';

import ProfileDropdown from '@/components/ProfileDropdown';
import * as sessionHook from '@/hooks/useSession';
import { User } from '@/types/user';

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

jest.mock('@/components/buttons/ImportButton', () => jest.fn(
  () => <div data-testid="ImportButton" />,
));

describe('ProfileDropdown', () => {
  beforeEach(() => {
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      user: {
        name: '',
        image: '',
        email: '',
      } as User,
    } as sessionHook.SessionReturn);
  });

  it('renders with empty user', () => {
    const { container } = render(<ProfileDropdown />);
    expect(container).toMatchSnapshot();
  });

  it('renders with user', () => {
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      user: {
        name: 'Maffin IO',
        image: 'https://example.com',
        email: 'iomaffin@gmail.com',
      } as User,
    } as sessionHook.SessionReturn);
    const { container } = render(<ProfileDropdown />);
    expect(container).toMatchSnapshot();
  });
});
