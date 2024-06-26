import React from 'react';
import { render, screen } from '@testing-library/react';
import * as navigation from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import * as auth0 from '@auth0/auth0-react';

import LoginPage from '@/app/user/login/page';
import * as errors from '@/helpers/errors';

jest.mock('next/navigation');
jest.mock('@auth0/auth0-react', () => ({
  __esModule: true,
  ...jest.requireActual('@auth0/auth0-react'),
}));

jest.mock('@/helpers/errors', () => ({
  __esModule: true,
  ...jest.requireActual('@/helpers/errors'),
}));

describe('LoginPage', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockRouterPush = jest.fn();
    jest.spyOn(navigation, 'useRouter').mockImplementation(() => ({
      push: mockRouterPush as AppRouterInstance['push'],
    } as AppRouterInstance));

    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      isAuthenticated: false,
    } as auth0.Auth0ContextInterface<auth0.User>);
  });

  it('sends to dashboard when authenticated', async () => {
    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      isAuthenticated: true,
    } as auth0.Auth0ContextInterface<auth0.User>);
    render(<LoginPage />);

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/accounts');
  });

  it('shows loading... when not finished', () => {
    const { container } = render(<LoginPage />);
    expect(container).toMatchSnapshot();
  });

  it('calls loginWithPopup when clicking sign in button', async () => {
    const mockLogin = jest.fn();
    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      isAuthenticated: true,
      loginWithPopup: mockLogin as Function,
    } as auth0.Auth0ContextInterface<auth0.User>);

    render(<LoginPage />);
    screen.getByText('Sign In').click();

    expect(mockLogin).toBeCalled();
  });

  it.each(
    [
      ['auth failed', 'UNKNOWN'],
      ['INVALID_SUBSCRIPTION', 'INVALID_SUBSCRIPTION'],
    ],
  )('shows %s error', async (message, code) => {
    const mockShow = jest.fn();
    jest.spyOn(errors, 'AuthError').mockReturnValue({
      show: mockShow as Function,
    } as errors.StorageError);
    const mockLogin = jest.fn();
    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      error: { message },
      loginWithPopup: mockLogin as Function,
    } as auth0.Auth0ContextInterface<auth0.User>);

    render(<LoginPage />);
    screen.getByText('Sign In').click();

    expect(errors.AuthError).toBeCalledWith(message, code);
    expect(mockShow).toBeCalled();
  });
});
