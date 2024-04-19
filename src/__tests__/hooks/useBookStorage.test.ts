import { renderHook, waitFor } from '@testing-library/react';

import useBookStorage from '@/hooks/useBookStorage';
import * as gapiHooks from '@/hooks/useGapiClient';
import BookStorage from '@/lib/storage/GDriveBookStorage';
import DemoBookStorage from '@/lib/storage/DemoBookStorage';
import * as helpers_env from '@/helpers/env';

jest.mock('@/hooks/useGapiClient', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useGapiClient'),
}));

jest.mock('@/lib/storage/GDriveBookStorage');

jest.mock('@/helpers/env', () => ({
  __esModule: true,
  get IS_DEMO_PLAN() {
    return false;
  },
  get IS_PAID_PLAN() {
    return false;
  },
}));

describe('useBookStorage', () => {
  beforeEach(() => {
    jest.spyOn(gapiHooks, 'default').mockReturnValue([false]);
    jest.spyOn(helpers_env, 'IS_PAID_PLAN', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if gapi not loaded', () => {
    const { result } = renderHook(() => useBookStorage());

    expect(result.current).toEqual({ storage: null });
  });

  it('returns storage if gapi is loaded', async () => {
    window.gapi = {
      client: {} as typeof gapi.client,
    } as typeof gapi;
    jest.spyOn(gapiHooks, 'default').mockReturnValue([true]);

    const { result, rerender } = renderHook(() => useBookStorage());
    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({ storage: expect.any(BookStorage) });
    });
  });

  it('returns DemoStorage when IS_DEMO_PLAN', async () => {
    jest.spyOn(helpers_env, 'IS_PAID_PLAN', 'get').mockReturnValue(false);
    jest.spyOn(helpers_env, 'IS_DEMO_PLAN', 'get').mockReturnValue(true);
    window.gapi = {
      client: {} as typeof gapi.client,
    } as typeof gapi;
    jest.spyOn(gapiHooks, 'default').mockReturnValue([true]);

    const { result, rerender } = renderHook(() => useBookStorage());
    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({ storage: expect.any(DemoBookStorage) });
    });
  });

  it('inits storage', async () => {
    window.gapi = {
      client: {} as typeof gapi.client,
    } as typeof gapi;
    jest.spyOn(gapiHooks, 'default').mockReturnValue([true]);

    const { result, rerender } = renderHook(() => useBookStorage());
    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({ storage: expect.any(BookStorage) });
    });
    expect(BookStorage.prototype.initStorage).toBeCalledTimes(1);
  });
});
