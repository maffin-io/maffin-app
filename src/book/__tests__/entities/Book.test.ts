import {
  createConnection,
  getConnection,
  BaseEntity,
} from 'typeorm';

import {
  Book,
  Commodity,
  Transaction,
  Split,
  Account,
} from '../../entities';

describe('Book', () => {
  let instance: Book;

  beforeEach(async () => {
    await createConnection({
      type: 'sqljs',
      dropSchema: true,
      entities: [Book, Account, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });

    await Account.create({
      guid: 'root_guid',
      name: 'name',
      type: 'ROOT',
    }).save();

    instance = await Book.create({
      guid: 'guid',
      fk_root: 'root_guid',
    }).save();
  });

  afterEach(async () => {
    const conn = await getConnection();
    await conn.close();
  });

  it('is active record', () => {
    expect(instance).toBeInstanceOf(BaseEntity);
  });

  it('can retrieve books', async () => {
    const books = await Book.find({ relations: ['fk_root'] });

    expect(books[0].guid).toEqual('guid');
    expect(books[0].root.guid).toEqual('root_guid');
  });
});
