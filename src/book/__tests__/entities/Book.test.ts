import { DataSource, BaseEntity } from 'typeorm';

import {
  Book,
  Commodity,
  Transaction,
  Split,
  Account,
  BankConfig,
} from '../../entities';

describe('Book', () => {
  let instance: Book;
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, BankConfig, Book, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    const root = await Account.create({
      name: 'name',
      type: 'ROOT',
    }).save();

    instance = await Book.create({
      fk_root: root,
    }).save();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  it('is active record', () => {
    expect(instance).toBeInstanceOf(BaseEntity);
  });

  it('can retrieve books', async () => {
    const books = await Book.find({ relations: ['fk_root'] });

    expect(books[0].root.name).toEqual('name');
  });
});
