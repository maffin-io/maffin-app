import React from 'react';
import { render } from '@testing-library/react';

import ProfileDropdown from '@/components/ProfileDropdown';
import * as sessionHook from '@/hooks/useSession';
import type { User } from '@auth0/auth0-react';
import ImportButton from '@/components/buttons/ImportButton';
import ExportButton from '@/components/buttons/ExportButton';

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

jest.mock('@/components/buttons/ImportButton', () => jest.fn(
  () => <div data-testid="ImportButton" />,
));

jest.mock('@/components/buttons/ExportButton', () => jest.fn(
  () => <div data-testid="ExportButton" />,
));

describe('ProfileDropdown', () => {
  beforeEach(() => {
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      user: {
        name: '',
        picture: '',
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
        picture: 'https://example.com',
        email: 'iomaffin@gmail.com',
      } as User,
    } as sessionHook.SessionReturn);

    const { container } = render(<ProfileDropdown />);

    expect(container).toMatchSnapshot();
    expect(ImportButton).toBeCalledWith(
      {
        role: 'menuitem',
        className: 'text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap',
      },
      undefined,
    );
    expect(ExportButton).toBeCalledWith(
      {
        role: 'menuitem',
        className: 'text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap',
      },
      undefined,
    );
  });
});
