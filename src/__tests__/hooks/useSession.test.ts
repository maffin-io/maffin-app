import { renderHook, waitFor } from '@testing-library/react';
import * as auth0 from '@auth0/auth0-react';

import useSession from '@/hooks/useSession';
import * as jwt from '@/lib/jwt';

jest.mock('next/navigation');

jest.mock('@auth0/auth0-react', () => ({
  __esModule: true,
  ...jest.requireActual('@auth0/auth0-react'),
}));

jest.mock('@/lib/jwt', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/jwt'),
}));

describe('useSession', () => {
  beforeEach(() => {
    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      isAuthenticated: false,
      getAccessTokenSilently: jest.fn() as Function,
    } as auth0.Auth0ContextInterface<auth0.User>);
    jest.spyOn(jwt, 'isPremium').mockResolvedValue(false);
  });

  it('returns emptyUser when no user', async () => {
    const { result } = renderHook(() => useSession());

    expect(result.current.isPremium).toBe(false);
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
      getAccessTokenSilently: jest.fn() as Function,
    } as auth0.Auth0ContextInterface<auth0.User>);

    const { result } = renderHook(() => useSession());

    expect(result.current.accessToken).toEqual('accessToken');
    expect(result.current.user).toEqual(user);
  });

  it('returns isPremium to true when premium', async () => {
    jest.spyOn(jwt, 'isPremium').mockResolvedValue(true);
    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      isAuthenticated: true,
      getAccessTokenSilently: jest.fn() as Function,
    } as auth0.Auth0ContextInterface<auth0.User>);

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.isPremium).toBe(true));
  });
});
