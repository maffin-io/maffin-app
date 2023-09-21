import { renderHook, waitFor } from '@testing-library/react';
import type { InitSqlJsStatic } from 'sql.js';
import type { DataSource } from 'typeorm';
import * as swr from 'swr';

import { Account, Book } from '@/book/entities';
import useDataSource from '@/hooks/useDataSource';
import * as storageHooks from '@/hooks/useBookStorage';
import * as gnucash from '@/lib/gnucash';
import BookStorage from '@/apis/BookStorage';

jest.mock('swr');

jest.mock('@/hooks/useBookStorage', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useBookStorage'),
}));

jest.mock('@/lib/gnucash', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/gnucash'),
}));

jest.mock('typeorm', () => ({
  __esModule: true,
  ...jest.requireActual('typeorm'),
  DataSource: jest.fn().mockImplementation(() => {
    const mockInitialize = jest.fn();
    return {
      get isInitialized() {
        return mockInitialize.mock.calls.length > 0;
      },
      initialize: mockInitialize,
      sqljsManager: {
        loadDatabase: jest.fn(),
        exportDatabase: jest.fn().mockReturnValue(new Uint8Array([22, 33])),
      },
    };
  }),
}));

const mockInitSqlJs = jest.fn();
jest.mock('sql.js', () => ({
  __esModule: true,
  ...jest.requireActual('sql.js'),
  default: async (options: InitSqlJsStatic) => mockInitSqlJs(options),
}));

describe('useDataSource', () => {
  beforeEach(() => {
    jest.spyOn(storageHooks, 'default').mockReturnValue({ storage: null });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns as expected if book storage not ready', () => {
    const { result } = renderHook(() => useDataSource());

    expect(result.current).toEqual({
      datasource: expect.objectContaining(
        {
          isInitialized: false,
        },
      ),
      importBook: expect.any(Function),
      save: expect.any(Function),
      isLoaded: false,
    });

    expect(mockInitSqlJs).toBeCalledTimes(0);

    const datasource = result.current.datasource as DataSource;
    expect(datasource.initialize).toBeCalledTimes(0);
    expect(datasource.sqljsManager.loadDatabase).toBeCalledTimes(0);
  });

  it('initializes datasource with rawBook if storage available', async () => {
    const rawBook = new Uint8Array([21, 31]);
    const mockStorageGet = jest.fn().mockResolvedValue(rawBook) as typeof BookStorage.prototype.get;
    jest.spyOn(storageHooks, 'default').mockReturnValue({
      storage: {
        get: mockStorageGet,
      } as BookStorage,
    });

    const { result } = renderHook(() => useDataSource());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current).toMatchObject({
      datasource: {
        isInitialized: true,
      },
      isLoaded: true,
    });

    expect(mockInitSqlJs).toBeCalledTimes(1);
    expect(mockInitSqlJs).toHaveBeenCalledWith({ locateFile: expect.any(Function) });

    const datasource = result.current.datasource as DataSource;
    expect(datasource.initialize).toBeCalledTimes(1);
    expect(datasource.sqljsManager.loadDatabase).toBeCalledTimes(1);
    expect(datasource.sqljsManager.loadDatabase).toHaveBeenCalledWith(rawBook);
  });

  it('creates empty book when no data from storage', async () => {
    jest.spyOn(Account, 'create').mockImplementation((account) => account as Account);
    jest.spyOn(Account, 'upsert').mockImplementation();
    jest.spyOn(Book, 'upsert').mockImplementation();

    const rawBook = new Uint8Array();
    const mockStorageGet = jest.fn().mockResolvedValue(rawBook) as typeof BookStorage.prototype.get;
    jest.spyOn(storageHooks, 'default').mockReturnValue({
      storage: {
        get: mockStorageGet,
      } as BookStorage,
    });

    const { result } = renderHook(() => useDataSource());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const datasource = result.current.datasource as DataSource;
    expect(datasource.initialize).toBeCalledTimes(1);
    expect(datasource.sqljsManager.loadDatabase).toBeCalledTimes(0);

    expect(Book.upsert).toHaveBeenCalledWith(
      {
        guid: 'maffinBook',
        fk_root: 'rootAccount',
      },
      ['guid'],
    );

    expect(Account.upsert).toHaveBeenNthCalledWith(
      1,
      {
        guid: 'rootAccount',
        name: 'Root',
        type: 'ROOT',
      },
      ['guid'],
    );
  });

  it('initializes datasource only once', async () => {
    const rawBook = new Uint8Array([21, 31]);
    const mockStorageGet = jest.fn().mockResolvedValue(rawBook) as typeof BookStorage.prototype.get;
    jest.spyOn(storageHooks, 'default').mockReturnValue({
      storage: {
        get: mockStorageGet,
      } as BookStorage,
    });

    let { result } = renderHook(() => useDataSource());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    let datasource = result.current.datasource as DataSource;

    expect(datasource.initialize).toBeCalledTimes(1);
    expect(datasource.isInitialized).toBe(true);

    ({ result } = renderHook(() => useDataSource()));

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    datasource = result.current.datasource as DataSource;

    expect(datasource.initialize).toBeCalledTimes(1);
  });

  describe('dynamic functions', () => {
    beforeEach(async () => {
      const rawBook = new Uint8Array([21, 31]);
      jest.spyOn(storageHooks, 'default').mockReturnValue({
        storage: {
          get: jest.fn().mockResolvedValue(
            rawBook,
          ) as typeof BookStorage.prototype.get,
          save: jest.fn() as typeof BookStorage.prototype.save,
        } as BookStorage,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('save', () => {
      it('updates datasource, saves storage and mutates save state', async () => {
        const { result } = renderHook(() => useDataSource());

        await waitFor(() => expect(result.current.isLoaded).toBe(true));
        const datasource = result.current.datasource as DataSource;

        await result.current.save();
        expect(swr.mutate).toHaveBeenNthCalledWith(
          1,
          '/state/save',
          true,
          { revalidate: false },
        );
        expect(swr.mutate).toHaveBeenNthCalledWith(
          2,
          '/state/save',
          false,
          { revalidate: false },
        );
        expect(datasource.sqljsManager.exportDatabase).toBeCalledWith();

        const mockStorage = (storageHooks.default as jest.Mock).mock.results[0].value.storage;
        expect(mockStorage.save).toBeCalledWith(new Uint8Array([22, 33]));
      });
    });

    describe('importBook', () => {
      beforeEach(() => {
        jest.spyOn(gnucash, 'importBook').mockResolvedValue(new Uint8Array([44, 55]));
      });

      it('loads datasource database, mutates and saves', async () => {
        const { result } = renderHook(() => useDataSource());

        await waitFor(() => expect(result.current.isLoaded).toBe(true));
        const datasource = result.current.datasource as DataSource;

        const rawData = new Uint8Array([22, 33]);
        await result.current.importBook(rawData);

        expect(gnucash.importBook).toHaveBeenCalledWith(rawData);
        expect(datasource.sqljsManager.loadDatabase).toBeCalledWith(new Uint8Array([44, 55]));

        expect(swr.mutate).toBeCalledWith(expect.any(Function), undefined);
        const mockMutate = swr.mutate as jest.Mock;
        // verify the function we pass behaves as expected
        expect(mockMutate.mock.calls[0][0]('/api/test')).toBe(true);
        expect(mockMutate.mock.calls[0][0]('/api/asd/asd')).toBe(true);
        expect(mockMutate.mock.calls[0][0]('/state')).toBe(false);

        expect(swr.mutate).toHaveBeenNthCalledWith(
          2,
          '/state/save',
          true,
          { revalidate: false },
        );
        expect(swr.mutate).toHaveBeenNthCalledWith(
          3,
          '/state/save',
          false,
          { revalidate: false },
        );

        const mockStorage = (storageHooks.default as jest.Mock).mock.results[0].value.storage;
        expect(mockStorage.save).toBeCalledWith(new Uint8Array([22, 33]));
      });
    });
  });
});
