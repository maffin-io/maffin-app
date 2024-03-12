import { act, renderHook } from '@testing-library/react';

import { useOnline } from '@/hooks/state';
import * as errors from '@/helpers/errors';

jest.mock('@/helpers/errors', () => ({
  __esModule: true,
  ...jest.requireActual('@/helpers/errors'),
}));

describe('useOnline', () => {
  describe('online', () => {
    it('returns true', () => {
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      const { result } = renderHook(() => useOnline());

      expect(result.current.isOnline).toBe(true);
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

  describe('offline', () => {
    it('returns false when offline', async () => {
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      const { result } = renderHook(() => useOnline());

      expect(result.current.isOnline).toBe(false);
    });

    it('shows error', () => {
      const mockShow = jest.fn();
      jest.spyOn(errors, 'StorageError').mockReturnValue({
        show: mockShow as Function,
      } as errors.StorageError);
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(true);
      renderHook(() => useOnline());

      jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false);
      act(() => window.dispatchEvent(new Event('offline')));

      expect(errors.StorageError).toBeCalledWith('', 'OFFLINE');
      expect(mockShow).toBeCalled();
    });

    it('changes to offline', async () => {
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(true);
      const { result } = renderHook(() => useOnline());

      expect(result.current.isOnline).toBe(true);
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false);
      act(() => window.dispatchEvent(new Event('offline')));

      expect(result.current.isOnline).toBe(false);
    });
  });
});
