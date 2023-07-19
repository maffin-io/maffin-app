import initSqlJs from 'sql.js';
import { DataSource } from 'typeorm';
import { useSWRConfig } from 'swr';

import {
  Account,
  Book,
  Commodity,
  Price,
  Split,
  Transaction,
} from './entities';

export async function initDB(database: Uint8Array): Promise<DataSource> {
  await initSqlJs({
    // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
    locateFile: file => `https://sql.js.org/dist/${file}`,
  });

  let datasource: DataSource;

  if (database.length !== 0) {
    datasource = new DataSource({
      type: 'sqljs',
      synchronize: true,
      database,
      logging: false,
      entities: [Account, Book, Commodity, Price, Split, Transaction],
    });
    await datasource.initialize();
  } else {
    datasource = new DataSource({
      type: 'sqljs',
      synchronize: true,
      logging: false,
      entities: [Account, Book, Commodity, Price, Split, Transaction],
    });
    await datasource.initialize();
    await createEmptyBook();
  }

  return datasource;
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
