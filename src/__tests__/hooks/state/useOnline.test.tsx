import { act, renderHook } from '@testing-library/react';

import { useOnline } from '@/hooks/state';

describe('useOnline', () => {
  it('returns true when online', () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { result } = renderHook(() => useOnline());

    expect(result.current.isOnline).toBe(true);
  });

  it('returns false when offline', async () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { result } = renderHook(() => useOnline());

    expect(result.current.isOnline).toBe(false);
  });

  it('changes to offline', async () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(true);
    const { result } = renderHook(() => useOnline());

    expect(result.current.isOnline).toBe(true);
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false);
    act(() => window.dispatchEvent(new Event('offline')));

    expect(result.current.isOnline).toBe(false);
  });

  it('changes to online', async () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false);
    const { result } = renderHook(() => useOnline());

    expect(result.current.isOnline).toBe(false);
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(true);
    act(() => window.dispatchEvent(new Event('online')));

    expect(result.current.isOnline).toBe(true);
  });
});
