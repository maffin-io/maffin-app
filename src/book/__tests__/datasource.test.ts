import {
  DataSource,
} from 'typeorm';

import { initDB } from '../datasource';
import {
  Account,
  Book,
  Commodity,
  Price,
  Split,
  Transaction,
} from '../entities';

jest.mock('sql.js');

jest.mock('typeorm', () => ({
  __esModule: true,
  ...jest.requireActual('typeorm'),
  DataSource: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
  })),
}));

describe('initDB', () => {
  beforeEach(() => {
    jest.spyOn(Account, 'create').mockImplementation((account) => account as Account);
    jest.spyOn(Account, 'upsert').mockImplementation();
    jest.spyOn(Book, 'upsert').mockImplementation();
    jest.spyOn(Commodity, 'upsert').mockImplementation();
  });

  it('initializes datasource with binary data', async () => {
    const datasource = await initDB(new Uint8Array([22, 33]));

    expect(datasource).toEqual({ initialize: expect.any(Function) });
    expect(DataSource).toHaveBeenCalledWith({
      type: 'sqljs',
      database: new Uint8Array([22, 33]),
      synchronize: true,
      logging: false,
      entities: [Account, Book, Commodity, Price, Split, Transaction],
    });
    expect(datasource.initialize).toHaveBeenCalledWith();
    expect(Account.upsert).toHaveBeenCalledTimes(0);
    expect(Book.upsert).toHaveBeenCalledTimes(0);
    expect(Commodity.upsert).toHaveBeenCalledTimes(0);
  });

  it('creates empty root account and book if no binary data passed', async () => {
    const datasource = await initDB(new Uint8Array());

    expect(datasource).toEqual({ initialize: expect.any(Function) });
    expect(DataSource).toHaveBeenCalledWith({
      type: 'sqljs',
      synchronize: true,
      logging: false,
      entities: [Account, Book, Commodity, Price, Split, Transaction],
    });
    expect(datasource.initialize).toHaveBeenCalledWith();

    expect(Book.upsert).toHaveBeenCalledWith(
      {
        guid: 'maffinBook',
        fk_root: 'rootAccount',
      },
      ['guid'],
    );

    const rootAccount = {
      guid: 'rootAccount',
      name: 'Root',
      type: 'ROOT',
    };

    expect(Account.upsert).toHaveBeenNthCalledWith(
      1,
      rootAccount,
      ['guid'],
    );
  });
});
