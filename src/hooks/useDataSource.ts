import React from 'react';
import { DataSource } from 'typeorm';
import initSqlJs from 'sql.js';
import { mutate } from 'swr';
import pako from 'pako';

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
          initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` }),
          storage.get(),
        ]));

        // Due to async nature, this value can change between this and the previous statement
        // as it's a shared global
        if (!DATASOURCE.isInitialized) {
          const start = performance.now();
          await DATASOURCE.initialize();

          if (rawBook.length) {
            await DATASOURCE.sqljsManager.loadDatabase(rawBook);
          } else {
            await createEmptyBook();
          }
          const end = performance.now();
          console.log(`init datasource: ${end - start}ms`);
        }
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

  mutate((key: string) => key.startsWith('/api'), undefined);
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
