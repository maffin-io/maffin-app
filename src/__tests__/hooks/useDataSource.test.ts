import { renderHook, waitFor } from '@testing-library/react';

import useDataSource from '@/hooks/useDataSource';
import * as storageHooks from '@/hooks/useBookStorage';
import BookStorage from '@/apis/BookStorage';

jest.mock('@/hooks/useBookStorage', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useBookStorage'),
}));

const mockInitDB = jest.fn();
jest.mock('@/book/datasource', () => ({
  __esModule: true,
  initDB: async (rawBook: Uint8Array) => mockInitDB(rawBook),
}));

describe('useDataSource', () => {
  beforeEach(() => {
    jest.spyOn(storageHooks, 'default').mockReturnValue([null]);
  });

  it('returns null if book storage not ready', () => {
    const { result } = renderHook(() => useDataSource());

    expect(result.current).toEqual([null]);
  });

  it('returns datasource if bookStorage is loaded and creates it once only', async () => {
    const rawBook = new Uint8Array([21, 31]);
    const mockStorageGet = jest.fn().mockResolvedValue(rawBook) as typeof BookStorage.prototype.get;
    jest.spyOn(storageHooks, 'default').mockReturnValue([
      {
        get: mockStorageGet,
      } as BookStorage,
    ]);
    mockInitDB.mockResolvedValue({
      my: 'datasource',
    });

    let { result, rerender } = renderHook(() => useDataSource());
    rerender();

    await waitFor(() => {
      expect(result.current).toEqual([
        {
          my: 'datasource',
        },
      ]);
    });

    expect(mockStorageGet).toHaveBeenCalledTimes(1);
    expect(mockInitDB).toHaveBeenCalledWith(rawBook);

    ({ result, rerender } = renderHook(() => useDataSource()));
    rerender();

    await waitFor(() => {
      expect(result.current).toEqual([
        {
          my: 'datasource',
        },
      ]);
    });

    expect(mockStorageGet).toHaveBeenCalledTimes(1);
    expect(mockInitDB).toHaveBeenCalledTimes(1);
  });
});
