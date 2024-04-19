import { renderHook } from '@testing-library/react';
import * as auth0 from '@auth0/auth0-react';

import useSession from '@/hooks/useSession';

jest.mock('next/navigation');

jest.mock('@auth0/auth0-react', () => ({
  __esModule: true,
  ...jest.requireActual('@auth0/auth0-react'),
}));

jest.mock('@/helpers/env', () => ({
  __esModule: true,
}));

describe('useSession', () => {
  beforeEach(() => {
    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      isAuthenticated: false,
    } as auth0.Auth0ContextInterface<auth0.User>);
  });

  it('returns emptyUser when no user', async () => {
    const { result } = renderHook(() => useSession());

    expect(result.current.accessToken).toEqual('');
    expect(result.current.user).toEqual({
      email: '',
      picture: '',
      name: '',
    });
  });

  it('sets accessToken and user when authenticated', async () => {
    const user = {
      email: 'iomaffin@gmail.com',
      name: 'name',
      accessToken: 'accessToken',
    } as auth0.User;
    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      isAuthenticated: true,
      user,
    } as auth0.Auth0ContextInterface<auth0.User>);

    const { result } = renderHook(() => useSession());

    expect(result.current.accessToken).toEqual('accessToken');
    expect(result.current.user).toEqual(user);
  });
});
