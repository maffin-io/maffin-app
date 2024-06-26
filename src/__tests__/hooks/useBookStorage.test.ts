import { renderHook, waitFor } from '@testing-library/react';

import useBookStorage from '@/hooks/useBookStorage';
import * as gapiHooks from '@/hooks/useGapiClient';
import BookStorage from '@/lib/storage/GDriveBookStorage';
import DemoBookStorage from '@/lib/storage/DemoBookStorage';
import * as sessionHook from '@/hooks/useSession';

jest.mock('@/hooks/useGapiClient', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useGapiClient'),
}));

jest.mock('@/lib/storage/GDriveBookStorage');

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

describe('useBookStorage', () => {
  beforeEach(() => {
    jest.spyOn(gapiHooks, 'default').mockReturnValue([false]);
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      roles: { isPremium: true },
    } as sessionHook.SessionReturn);
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

  it('returns DemoStorage when not premium', async () => {
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      roles: { isPremium: false },
    } as sessionHook.SessionReturn);
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
