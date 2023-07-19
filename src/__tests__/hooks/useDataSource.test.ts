import { renderHook, waitFor } from '@testing-library/react';
import type { InitSqlJsStatic } from 'sql.js';

import { Account, Book } from '@/book/entities';
import useDataSource from '@/hooks/useDataSource';
import * as storageHooks from '@/hooks/useBookStorage';
import BookStorage from '@/apis/BookStorage';

jest.mock('@/hooks/useBookStorage', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useBookStorage'),
}));

const mockInitialize = jest.fn();
const mockLoadDatabase = jest.fn();
jest.mock('typeorm', () => ({
  __esModule: true,
  ...jest.requireActual('typeorm'),
  DataSource: jest.fn().mockImplementation(() => ({
    isInitialized: false,
    initialize: async () => mockInitialize(),
    sqljsManager: {
      loadDatabase: async (db: Uint8Array) => mockLoadDatabase(db),
    },
  })),
}));

const mockInitSqlJs = jest.fn();
jest.mock('sql.js', () => ({
  __esModule: true,
  ...jest.requireActual('sql.js'),
  default: async (options: InitSqlJsStatic) => mockInitSqlJs(options),
}));

describe('useDataSource', () => {
  beforeEach(() => {
    jest.spyOn(storageHooks, 'default').mockReturnValue([null]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if book storage not ready', () => {
    const { result } = renderHook(() => useDataSource());

    expect(result.current).toEqual([null]);

    expect(mockInitSqlJs).toBeCalledTimes(0);
    expect(mockInitialize).toBeCalledTimes(0);
    expect(mockLoadDatabase).toBeCalledTimes(0);
  });

  it('initializes datasource with rawBook if storage available', async () => {
    const rawBook = new Uint8Array([21, 31]);
    const mockStorageGet = jest.fn().mockResolvedValue(rawBook) as typeof BookStorage.prototype.get;
    jest.spyOn(storageHooks, 'default').mockReturnValue([
      {
        get: mockStorageGet,
      } as BookStorage,
    ]);

    const { result } = renderHook(() => useDataSource());

    await waitFor(() => {
      expect(result.current).not.toEqual([null]);
    });

    expect(mockInitSqlJs).toBeCalledTimes(1);
    expect(mockInitSqlJs).toHaveBeenCalledWith({ locateFile: expect.any(Function) });
    expect(mockInitialize).toBeCalledTimes(1);
    expect(mockLoadDatabase).toBeCalledTimes(1);
    expect(mockLoadDatabase).toHaveBeenCalledWith(rawBook);
  });

  it('creates empty book when no data from storage', async () => {
    jest.spyOn(Account, 'create').mockImplementation((account) => account as Account);
    jest.spyOn(Account, 'upsert').mockImplementation();
    jest.spyOn(Book, 'upsert').mockImplementation();

    const rawBook = new Uint8Array();
    const mockStorageGet = jest.fn().mockResolvedValue(rawBook) as typeof BookStorage.prototype.get;
    jest.spyOn(storageHooks, 'default').mockReturnValue([
      {
        get: mockStorageGet,
      } as BookStorage,
    ]);

    const { result } = renderHook(() => useDataSource());

    await waitFor(() => {
      expect(result.current).not.toEqual([null]);
    });

    expect(mockInitialize).toBeCalledTimes(1);
    expect(mockLoadDatabase).toBeCalledTimes(0);
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
    jest.spyOn(storageHooks, 'default').mockReturnValue([
      {
        get: mockStorageGet,
      } as BookStorage,
    ]);

    let { result } = renderHook(() => useDataSource());

    await waitFor(() => {
      expect(result.current).not.toEqual([null]);
    });

    expect(mockInitialize).toBeCalledTimes(1);
    // @ts-ignore
    result.current[0].isInitialized = true;

    ({ result } = renderHook(() => useDataSource()));

    await waitFor(() => {
      expect(result.current).not.toEqual([null]);
    });

    expect(mockInitialize).toBeCalledTimes(1);
  });
});
