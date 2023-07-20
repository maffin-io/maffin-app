import React from 'react';
import { DataSource } from 'typeorm';
import initSqlJs from 'sql.js';

import useBookStorage from '@/hooks/useBookStorage';
import {
  Account,
  Book,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';

export const DATASOURCE: DataSource = new DataSource({
  type: 'sqljs',
  synchronize: true,
  logging: false,
  entities: [Account, Book, Commodity, Price, Split, Transaction],
});

export default function useDataSource(): [DataSource | null] {
  const [bookStorage] = useBookStorage();
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      let rawBook: Uint8Array;
      if (bookStorage && !DATASOURCE.isInitialized) {
        ([, rawBook] = await Promise.all([
          initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` }),
          bookStorage.get(),
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
          setIsLoaded(true);
        }
      }
    }

    load();
  }, [bookStorage]);

  if (!isLoaded && !DATASOURCE.isInitialized) {
    return [null];
  }

  return [DATASOURCE];
}

// TODO: Need to mutate the accounts SWR key so Root is shown!
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
