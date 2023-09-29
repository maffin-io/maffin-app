import { DataSource } from 'typeorm';
import {
  Account,
  Book,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';

export default async function importBook(rawData: Uint8Array): Promise<Uint8Array> {
  const tempDataSource = new DataSource({
    type: 'sqljs',
    synchronize: true,
    database: rawData,
    logging: false,
    entities: [Account, Book, Commodity, Price, Split, Transaction],
  });
  await tempDataSource.initialize();

  const accounts = await Account.find();
  setAccountPaths(accounts.find(a => a.type === 'ROOT') as Account, accounts);
  await Promise.all(accounts.map(account => Account.update(
    { guid: account.guid },
    { path: account.path },
  )));

  await Account.delete({
    type: 'ROOT',
    name: 'Template Root',
  });

  return tempDataSource.sqljsManager.exportDatabase();
}

function setAccountPaths(current: Account, accounts: Account[]) {
  const parent = accounts.find(a => a.guid === current.parentId);
  if (!parent || parent.type === 'ROOT') {
    current.path = current.name;
  } else {
    current.path = `${parent.path}:${current.name}`;
  }

  current.childrenIds.forEach(childId => {
    const account = accounts.find(a => a.guid === childId) as Account;
    setAccountPaths(account, accounts);
  });
}
