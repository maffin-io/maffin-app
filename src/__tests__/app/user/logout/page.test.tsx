import React from 'react';
import { render } from '@testing-library/react';
import type { LinkProps } from 'next/link';
import * as auth0 from '@auth0/auth0-react';

import LogoutPage from '@/app/user/logout/page';

jest.mock('next/link', () => jest.fn(
  (
    props: LinkProps & { children?: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement>,
  ) => (
    <a className={props.className} href={props.href.toString()}>{props.children}</a>
  ),
));

jest.mock('@auth0/auth0-react', () => ({
  __esModule: true,
  ...jest.requireActual('@auth0/auth0-react'),
}));

describe('LogoutPage', () => {
  let mockLogout: jest.Mock;

  beforeEach(() => {
    mockLogout = jest.fn();
    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      logout: mockLogout as Function,
    } as auth0.Auth0ContextInterface<auth0.User>);
  });

  it('matches snapshot', () => {
    const { container } = render(<LogoutPage />);
    expect(container).toMatchSnapshot();
  });

  it('calls logout', () => {
    render(<LogoutPage />);

    expect(mockLogout).toBeCalledWith({
      logoutParams: {
        returnTo: 'http://localhost/user/login',
      },
    });
  });
});
