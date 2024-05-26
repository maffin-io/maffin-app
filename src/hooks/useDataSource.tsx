import React from 'react';
import { DataSource, QueryFailedError } from 'typeorm';
import initSqlJs from 'sql.js';
import { Settings } from 'luxon';
import pako from 'pako';

import { insertTodayPrices } from '@/lib/prices';
import useBookStorage from '@/hooks/useBookStorage';
import { migrate as migrateFromGnucash } from '@/lib/gnucash';
import {
  Account,
  Book,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { MIGRATIONS } from '@/book/migrations';
import { useQueryClient } from '@tanstack/react-query';
import type BookStorage from '@/lib/storage/BookStorage';
import { MaffinError, StorageError } from '@/helpers/errors';

export type DataSourceContextType = {
  datasource: DataSource | null,
  save: () => Promise<void>,
  importBook: (rawBook: Uint8Array) => Promise<void>,
  isLoaded: boolean,
};

const DATASOURCE: DataSource = new DataSource({
  type: 'sqljs',
  synchronize: true,
  logging: false,
  entities: [Account, Book, Commodity, Price, Split, Transaction],
  migrations: MIGRATIONS,
});

export const DataSourceContext = React.createContext<DataSourceContextType>({
  datasource: DATASOURCE,
  save: async () => {},
  importBook: async () => {},
  isLoaded: false,
});

export default function useDataSource(): DataSourceContextType {
  const { storage } = useBookStorage();
  const [isLoaded, setIsLoaded] = React.useState(DATASOURCE.isInitialized);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    async function load() {
      let rawBook: Uint8Array;
      if (storage && !DATASOURCE.isInitialized && queryClient) {
        ([, rawBook] = await Promise.all([
          initSqlJs({ locateFile: file => `/${file}` }),
          storage.get(),
        ]));

        // Due to async nature, this value can change between this and the previous statement
        // as it's a shared global
        if (!DATASOURCE.isInitialized) {
          DATASOURCE.setOptions({
            type: 'sqljs',
            synchronize: true,
            logging: false,
            entities: [Account, Book, Commodity, Price, Split, Transaction],
            migrations: MIGRATIONS,
            extra: {
              queryClient,
            },
          });
          const start = performance.now();
          await DATASOURCE.initialize();

          if (rawBook.length) {
            await DATASOURCE.sqljsManager.loadDatabase(rawBook);
            await DATASOURCE.runMigrations();
          } else {
            await createEmptyBook();
          }
          const end = performance.now();
          console.log(`init datasource: ${end - start}ms`);
        }
        loadStockerPrices();
        setIsLoaded(true);
      }
    }

    load();
  }, [storage, queryClient]);

  if (!isLoaded) {
    return {
      datasource: DATASOURCE,
      save: async () => {},
      importBook: async () => {},
      isLoaded: false,
    };
  }

  return {
    datasource: DATASOURCE,
    save: () => save(storage as BookStorage),
    importBook: (rawData: Uint8Array) => importBook(storage as BookStorage, rawData),
    isLoaded,
  };
}

async function save(storage: BookStorage) {
  DATASOURCE.options.extra.queryClient.setQueryData(['state', 'isSaving'], true);
  await DATASOURCE.query('VACUUM');
  const rawBook = DATASOURCE.sqljsManager.exportDatabase();
  try {
    await storage.save(rawBook);
  } catch (e) {
    (e as MaffinError).show();
  } finally {
    DATASOURCE.options.extra.queryClient.setQueryData(['state', 'isSaving'], false);
  }
}

async function importBook(storage: BookStorage, rawData: Uint8Array) {
  if (process.env.NEXT_PUBLIC_ENV !== 'master') {
    Settings.now = () => Date.now();
  }
  let parsedData;
  try {
    parsedData = pako.ungzip(rawData);
  } catch (err) {
    parsedData = rawData;
  }

  const previousData = DATASOURCE.sqljsManager.exportDatabase();
  await DATASOURCE.sqljsManager.loadDatabase(parsedData);
  try {
    // Sadly loadDatabase doesn't check that the file is valid so we call this to trigger
    // errors if any
    await DATASOURCE.query('VACUUM');
  } catch (e) {
    let code = 'UNKNOWN';
    if (e instanceof QueryFailedError) {
      code = 'INVALID_FILE';
    }
    new StorageError((e as Error).message, code).show();
    await DATASOURCE.sqljsManager.loadDatabase(previousData);
    return;
  }

  // We probably should do this conditionally only for when it is a gnucash file
  await migrateFromGnucash();
  DATASOURCE.options.extra.queryClient.refetchQueries({
    queryKey: ['api'],
    type: 'all',
  });

  loadStockerPrices();
  await save(storage);
}

async function createEmptyBook() {
  const rootAccount = Account.create({
    guid: 'rootAccount',
    name: 'Root',
    type: 'ROOT',
  });
  await Account.upsert(rootAccount, ['guid']);

  await Book.upsert(
    {
      guid: 'maffinBook',
      fk_root: rootAccount.guid,
    },
    ['guid'],
  );
}

async function loadStockerPrices() {
  try {
    // We have to await because we use Price.upsert. Once we correct this,
    // saving Price already updates the local cache so we don't need await
    await insertTodayPrices();
  } catch (e) {
    console.warn(`Retrieving live prices failed ${e}`);
  }
}
