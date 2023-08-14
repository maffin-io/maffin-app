import { renderHook } from '@testing-library/react';
import type { SWRResponse } from 'swr';

import useUser from '@/hooks/useUser';
import * as apiHook from '@/hooks/api';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');

describe('useUser', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockRouterPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockRouterPush,
    }));

    jest.spyOn(apiHook, 'useUser').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('redirects and resets storage if user and not logged in', async () => {
    const mockStorageSetItem = jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(apiHook, 'useUser').mockReturnValue(
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
  });

  it('returns user when logged in and doesnt redirect', async () => {
    const mockStorageSetItem = jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(apiHook, 'useUser').mockReturnValue(
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
