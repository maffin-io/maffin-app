import React from 'react';
import { DataSource } from 'typeorm';
import initSqlJs from 'sql.js';
import { mutate } from 'swr';
import pako from 'pako';

import { insertTodayPrices } from '@/lib/Stocker';
import useBookStorage from '@/hooks/useBookStorage';
import { importBook as importGnucashBook } from '@/lib/gnucash';
import {
  Account,
  Book,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { MIGRATIONS } from '@/book/migrations';
import { isStaging } from '@/helpers/env';
import { useQueryClient } from '@tanstack/react-query';
import type BookStorage from '@/lib/storage/BookStorage';

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
        await loadStockerPrices();
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
  mutate('/state/save', true, { revalidate: false });
  const rawBook = DATASOURCE.sqljsManager.exportDatabase();
  await storage.save(rawBook);
  mutate('/state/save', false, { revalidate: false });
}

async function importBook(storage: BookStorage, rawData: Uint8Array) {
  let parsedData;
  try {
    parsedData = pako.ungzip(rawData);
  } catch (err) {
    parsedData = rawData;
  }

  const rawBook = await importGnucashBook(parsedData);
  await DATASOURCE.sqljsManager.loadDatabase(rawBook);

  DATASOURCE.options.extra.queryClient.refetchQueries({
    type: 'all',
  });

  await loadStockerPrices();
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
  if (!isStaging()) {
    try {
      // We have to await because we use Price.upsert. Once we correct this,
      // saving Price already updates the local cache so we don't need await
      await insertTodayPrices();
    } catch (e) {
      console.warn(`Retrieving live prices failed ${e}`);
    }
  }
}
