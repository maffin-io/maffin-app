import { renderHook } from '@testing-library/react';
import type { SWRResponse } from 'swr';

import useUser from '@/hooks/useUser';
import * as gapiHooks from '@/hooks/useGapiClient';
import * as apiHook from '@/hooks/useApi';

jest.mock('@/hooks/useApi', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useApi'),
}));

jest.mock('@/hooks/useGapiClient', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useGapiClient'),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');

describe('useUser', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    jest.spyOn(gapiHooks, 'default').mockReturnValue([false]);

    mockRouterPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockRouterPush,
    }));

    jest.spyOn(apiHook, 'default').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('returns empty user if gapi not loaded and doesnt redirect', async () => {
    const { result } = renderHook(() => useUser());

    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(result.current.user).toEqual({
      name: '',
      email: '',
      image: '',
      isLoggedIn: false,
    });
    expect(apiHook.default).toBeCalledWith(null);
  });

  it('redirects and resets storage if user and not logged in', async () => {
    const mockStorageSetItem = jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(gapiHooks, 'default').mockReturnValue([true]);
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: {
          name: '',
          email: '',
          image: '',
          isLoggedIn: false,
        },
      } as SWRResponse,
    );
    const { result } = renderHook(() => useUser());

    expect(mockRouterPush).toBeCalledWith('/user/login');
    expect(mockStorageSetItem).toBeCalledWith('accessToken', '');
    expect(result.current.user).toEqual({
      name: '',
      email: '',
      image: '',
      isLoggedIn: false,
    });
    expect(apiHook.default).toBeCalledWith('/api/user');
  });

  it('returns user when logged in and doesnt redirect', async () => {
    const mockStorageSetItem = jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(gapiHooks, 'default').mockReturnValue([true]);
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: {
          name: 'name',
          email: 'email',
          image: 'image',
          isLoggedIn: true,
        },
      } as SWRResponse,
    );
    const { result } = renderHook(() => useUser());

    expect(mockRouterPush).not.toBeCalled();
    expect(mockStorageSetItem).not.toBeCalled();
    expect(result.current.user).toEqual({
      name: 'name',
      email: 'email',
      image: 'image',
      isLoggedIn: true,
    });
  });
});
