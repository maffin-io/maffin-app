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

  await Promise.all([
    Account.delete({
      type: 'ROOT',
      name: 'Template Root',
    }),
    Account.update(
      { type: 'STOCK' },
      { type: 'INVESTMENT' },
    ),
    Account.update(
      { type: 'MUTUAL' },
      { type: 'INVESTMENT' },
    ),
  ]);

  return tempDataSource.sqljsManager.exportDatabase();
}
