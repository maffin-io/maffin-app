import { renderHook, waitFor } from '@testing-library/react';
import type { InitSqlJsStatic } from 'sql.js';
import type { DataSource } from 'typeorm';
import * as query from '@tanstack/react-query';

import { Account, Book, Commodity } from '@/book/entities';
import useDataSource from '@/hooks/useDataSource';
import * as storageHooks from '@/hooks/useBookStorage';
import * as gnucash from '@/lib/gnucash';
import * as queries from '@/lib/queries';
import type BookStorage from '@/lib/storage/GDriveBookStorage';
import type { QueryClient } from '@tanstack/react-query';
import { MaffinError } from '@/helpers/errors';

jest.mock('@tanstack/react-query');

jest.mock('@/hooks/useBookStorage', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useBookStorage'),
}));

jest.mock('@/lib/gnucash', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/gnucash'),
}));

jest.mock('@/lib/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/queries'),
}));

jest.mock('@/lib/Stocker', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/Stocker'),
  insertTodayPrices: jest.fn(),
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
      runMigrations: jest.fn(),
      initialize: mockInitialize,
      setOptions: jest.fn(),
      query: jest.fn(),
      sqljsManager: {
        loadDatabase: jest.fn(),
        exportDatabase: jest.fn().mockReturnValue(new Uint8Array([22, 33])),
      },
      options: {
        extra: {
          queryClient: {
            refetchQueries: jest.fn(),
            setQueryData: jest.fn(),
          },
        },
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
    jest.spyOn(query, 'useQueryClient').mockReturnValue({} as QueryClient);
    jest.spyOn(storageHooks, 'default').mockReturnValue({ storage: null });
    jest.spyOn(Account, 'find').mockResolvedValue([
      {
        name: 'root',
        type: 'ROOT',
        childrenIds: ['1'],
      } as Account,
      {
        guid: '1',
        name: 'assets',
        type: 'ASSET',
        commodity: {
          mnemonic: 'EUR',
        },
      } as Account,
    ]);
    jest.spyOn(queries, 'getMonthlyTotals').mockImplementation();
    jest.spyOn(queries, 'getPrices').mockImplementation();
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

  it('initializes datasource with rawBook and queryClient if storage available', async () => {
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
    expect(datasource.setOptions).toBeCalledWith(expect.objectContaining({
      extra: {
        queryClient: {},
      },
    }));
    expect(datasource.runMigrations).toBeCalledTimes(1);
  });

  it('creates empty book when no data from storage', async () => {
    // @ts-ignore
    jest.spyOn(Commodity, 'create').mockReturnValue({ save: jest.fn() });
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
    let rawBook: Uint8Array;

    beforeEach(async () => {
      rawBook = new Uint8Array([21, 31]);
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
      it('updates datasource, vacuums, saves storage and updates state', async () => {
        const { result } = renderHook(() => useDataSource());

        await waitFor(() => expect(result.current.isLoaded).toBe(true));
        const datasource = result.current.datasource as DataSource;

        await result.current.save();
        expect(datasource.query).toBeCalledWith('VACUUM');
        expect(datasource.options.extra.queryClient.setQueryData).toHaveBeenNthCalledWith(
          1,
          ['state', 'isSaving'],
          true,
        );
        expect(datasource.options.extra.queryClient.setQueryData).toHaveBeenNthCalledWith(
          2,
          ['state', 'isSaving'],
          false,
        );
        expect(datasource.sqljsManager.exportDatabase).toBeCalledWith();

        const mockStorage = (storageHooks.default as jest.Mock).mock.results[0].value.storage;
        expect(mockStorage.save).toBeCalledWith(new Uint8Array([22, 33]));
      });

      it('shows error toast on failure', async () => {
        jest.spyOn(MaffinError.prototype, 'show');
        jest.spyOn(storageHooks, 'default').mockReturnValue({
          storage: {
            get: jest.fn().mockResolvedValue(rawBook) as typeof BookStorage.prototype.get,
            save: jest.fn(() => { throw new MaffinError('e', 'code'); }) as typeof BookStorage.prototype.save,
          } as BookStorage,
        });
        const { result } = renderHook(() => useDataSource());

        await waitFor(() => expect(result.current.isLoaded).toBe(true));
        await result.current.save();

        expect(MaffinError.prototype.show).toBeCalled();
      });
    });

    describe('importBook', () => {
      beforeEach(() => {
        jest.spyOn(gnucash, 'importBook').mockResolvedValue(new Uint8Array([44, 55]));
      });

      it('loads datasource database, updates state and saves', async () => {
        const { result } = renderHook(() => useDataSource());

        await waitFor(() => expect(result.current.isLoaded).toBe(true));
        const datasource = result.current.datasource as DataSource;

        const rawData = new Uint8Array([22, 33]);
        await result.current.importBook(rawData);

        expect(gnucash.importBook).toHaveBeenCalledWith(rawData);
        expect(datasource.sqljsManager.loadDatabase).toBeCalledWith(new Uint8Array([44, 55]));

        expect(datasource.options.extra.queryClient.refetchQueries).toBeCalledWith({
          queryKey: ['api'],
          type: 'all',
        });

        expect(datasource.options.extra.queryClient.setQueryData).toHaveBeenNthCalledWith(
          1,
          ['state', 'isSaving'],
          true,
        );
        expect(datasource.options.extra.queryClient.setQueryData).toHaveBeenNthCalledWith(
          2,
          ['state', 'isSaving'],
          false,
        );

        const mockStorage = (storageHooks.default as jest.Mock).mock.results[0].value.storage;
        expect(mockStorage.save).toBeCalledWith(new Uint8Array([22, 33]));
      });
    });
  });
});
