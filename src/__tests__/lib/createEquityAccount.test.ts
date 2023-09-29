import { DataSource } from 'typeorm';

import createEquityAccount from '@/lib/createEquityAccount';
import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import * as queries from '@/lib/queries';

jest.mock('@/lib/queries');

describe('createEquityAccount', () => {
  let datasource: DataSource;
  let eur: Commodity;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({
      guid: 'eur',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    jest.spyOn(queries, 'getMainCurrency').mockResolvedValue(eur);
  });

  it('fails when no root', async () => {
    await expect(createEquityAccount(eur)).rejects.toThrow();
  });

  it('creates root equity when does not exist', async () => {
    const root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();

    const balanceEquity = await createEquityAccount(eur);
    const rootEquity = await Account.findOneByOrFail({
      type: 'EQUITY',
      name: 'Equity',
    });

    expect(rootEquity).toMatchObject({
      fk_commodity: eur,
      parentId: root.guid,
      childrenIds: [balanceEquity.guid],
    });

    expect(balanceEquity).toMatchObject({
      name: 'Opening balances - EUR',
      type: 'EQUITY',
      fk_commodity: eur,
      parentId: rootEquity.guid,
    });
  });

  it('uses equity root when exists', async () => {
    const root = await Account.create({
      name: 'Root',
      type: 'ROOT',
    }).save();

    const equityRoot = await Account.create({
      name: 'Equity',
      type: 'EQUITY',
      fk_commodity: eur,
      parent: root,
    }).save();

    const balanceEquity = await createEquityAccount(eur);

    expect(balanceEquity.parentId).toEqual(equityRoot.guid);
  });
});
