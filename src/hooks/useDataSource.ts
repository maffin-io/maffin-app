import React from 'react';
import { DataSource } from 'typeorm';
import initSqlJs from 'sql.js';
import { mutate } from 'swr';
import pako from 'pako';

import * as queries from '@/lib/queries';
import { PriceDB } from '@/book/prices';

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
import type BookStorage from '@/apis/BookStorage';
import { MIGRATIONS } from '@/book/migrations';

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

  React.useEffect(() => {
    async function load() {
      let rawBook: Uint8Array;
      if (storage && !DATASOURCE.isInitialized) {
        ([, rawBook] = await Promise.all([
          initSqlJs({ locateFile: file => `/${file}` }),
          storage.get(),
        ]));

        // Due to async nature, this value can change between this and the previous statement
        // as it's a shared global
        if (!DATASOURCE.isInitialized) {
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
        await preloadData();
        setIsLoaded(true);
      }
    }

    load();
  }, [storage]);

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
    save: () => save(storage),
    importBook: (rawData: Uint8Array) => importBook(storage, rawData),
    isLoaded,
  };
}

async function save(storage: BookStorage | null) {
  mutate('/state/save', true, { revalidate: false });
  const rawBook = DATASOURCE.sqljsManager.exportDatabase();
  await (storage as BookStorage).save(rawBook);
  mutate('/state/save', false, { revalidate: false });
}

async function importBook(storage: BookStorage | null, rawData: Uint8Array) {
  let parsedData;
  try {
    parsedData = pako.ungzip(rawData);
  } catch (err) {
    parsedData = rawData;
  }

  const rawBook = await importGnucashBook(parsedData);
  await DATASOURCE.sqljsManager.loadDatabase(rawBook);

  // Remove all previous data from the state
  mutate((key: string) => key.startsWith('/api'), undefined);
  await preloadData();
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

/**
 * Preloads data that is important to render the main page quickly.
 *
 * Without this, we need to wait for SWR to load monthly-totals
 * "naturally" which takes seconds (because it depends on accounts
 * and todayPrices).
 */
async function preloadData() {
  // Pre load actively to increase render time for users
  const [accounts, todayPrices] = await Promise.all([
    queries.getAccounts(),
    PriceDB.getTodayQuotes(),
  ]);
  mutate('/api/main-currency', accounts.type_asset?.commodity);
  mutate(
    '/api/monthly-totals',
    async () => queries.getMonthlyTotals(accounts, todayPrices),
  );
}
