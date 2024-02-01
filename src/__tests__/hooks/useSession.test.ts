import { act, renderHook, waitFor } from '@testing-library/react';
import { DateTime } from 'luxon';
import * as navigation from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import useSession from '@/hooks/useSession';
import * as Stocker from '@/lib/Stocker';
import * as helpers_env from '@/helpers/env';
import type { Credentials } from '@/types/user';

jest.mock('next/navigation');

jest.mock('@/lib/Stocker', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/Stocker'),
}));

jest.mock('@/helpers/env', () => ({
  __esModule: true,
  isStaging: () => false,
}));

const SESSION: Credentials = {
  access_token: 'at',
  refresh_token: 'rt',
  expiry_date: 1706841538379,
  id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImlvbWFmZmluQGdtYWlsLmNvbSIsInBpY3R1cmUiOiJwaWN0dXJlIiwibmFtZSI6Ik1hZmZpbiBJTyIsImlhdCI6MTUxNjIzOTAyMn0.rxfAOUMY0t4AmKs_Xb7gJFwOsUSwfwk7aLDaCNk-tIk',
};

describe('useSession', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    localStorage.removeItem('session');

    // 2023-01-01
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromMillis(1672531200000) as DateTime<true>);
    jest.spyOn(helpers_env, 'isStaging').mockReturnValue(false);

    mockRouterPush = jest.fn();
    jest.spyOn(navigation, 'useRouter').mockImplementation(() => ({
      push: mockRouterPush as AppRouterInstance['push'],
    } as AppRouterInstance));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('loads session from localStorage', () => {
    localStorage.setItem('session', JSON.stringify(SESSION));
    const { result } = renderHook(() => useSession());

    expect(result.current.session).toEqual(SESSION);
    expect(result.current.user).toEqual({
      email: 'iomaffin@gmail.com',
      image: 'picture',
      name: 'Maffin IO',
    });
  });

  it('redirects to /user/login if no session in localStorage', () => {
    renderHook(() => useSession());

    expect(mockRouterPush).toBeCalledWith('/user/login');
  });

  it('updates localStorage whenever session data changes', async () => {
    localStorage.setItem('session', JSON.stringify(SESSION));
    const { result } = renderHook(() => useSession());

    const newCredentials = {
      ...SESSION,
      access_token: 'newat',
      refresh_token: 'newrt',
      id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImlvbWFmZmluQGdtYWlsLmNvbSIsImlhdCI6MTUxNjIzOTAyMn0.EHc4Mf5W0zcRVN58IkYGCvG9HTdTz0Q-EVunQFt5Bbc',
    };

    act(() => result.current.setCredentials(newCredentials));

    expect(result.current.session).toEqual(newCredentials);
    expect(result.current.user).toEqual({
      email: 'iomaffin@gmail.com',
      image: '',
      name: '',
    });
    expect(JSON.parse(localStorage.getItem('session') as string)).toEqual(newCredentials);
  });

  it('returns fake user when staging', async () => {
    jest.spyOn(helpers_env, 'isStaging').mockReturnValue(true);
    localStorage.setItem('session', JSON.stringify(SESSION));
    const { result } = renderHook(() => useSession());

    expect(result.current.user).toEqual({
      email: 'iomaffin@gmail.com',
      image: '',
      name: 'Maffin',
    });
  });

  it('revoke removes localStorage session and sends to login', async () => {
    localStorage.setItem('session', JSON.stringify(SESSION));
    const { result } = renderHook(() => useSession());

    act(() => result.current.revoke());

    expect(localStorage.getItem('session')).toEqual(null);
    expect(mockRouterPush).toBeCalledWith('/user/login');
  });

  it('refreshes access token when expired', async () => {
    localStorage.setItem(
      'session',
      JSON.stringify({
        ...SESSION,
        expiry_date: 1672530200000, // Before DateTime.now
      }),
    );
    const newCredentials = {
      ...SESSION,
      access_token: 'newat',
      refresh_token: 'newrt',
      id_token: 'id_token',
    };
    const mockRefresh = jest.spyOn(Stocker, 'refresh').mockResolvedValue(newCredentials);

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(mockRefresh).toBeCalledWith('rt'));
    // Make sure newCredentials are set but id_token is kept from previous values.
    expect(result.current.session).toEqual({
      ...newCredentials,
      id_token: SESSION.id_token,
    });
  });

  it('checks every 10s for access token expiring', async () => {
    jest.useFakeTimers();
    localStorage.setItem(
      'session',
      JSON.stringify({
        ...SESSION,
        expiry_date: 1672531220000, // 20s after now
      }),
    );
    const newCredentials = {
      ...SESSION,
      access_token: 'newat',
      refresh_token: 'newrt',
    };
    const mockRefresh = jest.spyOn(Stocker, 'refresh').mockResolvedValue(newCredentials);

    const { result } = renderHook(() => useSession());

    expect(mockRefresh).not.toBeCalled();
    await waitFor(() => expect(result.current.session).toEqual({
      ...SESSION,
      expiry_date: 1672531220000, // 20s after now
    }));

    act(() => {
      jest.runOnlyPendingTimers();
    });

    act(() => {
      // Advance DateTime.now 20 seconds so expiry date check changes to expired
      jest.spyOn(DateTime, 'now').mockReturnValue(
        DateTime.fromMillis(1672531220001) as DateTime<true>,
      );
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => expect(mockRefresh).toBeCalledTimes(1));
    await waitFor(() => expect(result.current.session).toEqual(newCredentials));
  });
});
