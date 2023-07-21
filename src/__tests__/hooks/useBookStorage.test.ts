import { renderHook, waitFor } from '@testing-library/react';

import useBookStorage from '@/hooks/useBookStorage';
import * as gapiHooks from '@/hooks/useGapiClient';
import BookStorage from '@/apis/BookStorage';

jest.mock('@/hooks/useGapiClient', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useGapiClient'),
}));

jest.mock('@/apis/BookStorage');

describe('useBookStorage', () => {
  beforeEach(() => {
    jest.spyOn(gapiHooks, 'default').mockReturnValue([false]);
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
    const rawBook = new Uint8Array([21, 31]);
    jest.spyOn(BookStorage.prototype, 'get').mockResolvedValue(rawBook);

    const { result, rerender } = renderHook(() => useBookStorage());
    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({ storage: expect.any(BookStorage) });
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
