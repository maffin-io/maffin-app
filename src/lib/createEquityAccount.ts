import { Account, Commodity } from '@/book/entities';
import { getMainCurrency } from './queries';

export default async function createEquityAccount(
  commodity: Commodity,
): Promise<Account> {
  let rootEquity = await Account.findOneBy({
    type: 'EQUITY',
    parent: {
      type: 'ROOT',
    },
  });

  if (!rootEquity) {
    const root = await Account.findOneByOrFail({
      type: 'ROOT',
    });

    rootEquity = await Account.create({
      type: 'EQUITY',
      name: 'Equity',
      fk_commodity: await getMainCurrency(),
      description: 'Equity accounts are used to store the opening balances when you create new accounts',
      parent: root,
      hidden: true,
    }).save();
  }

  const equityAccount = await Account.create({
    type: 'EQUITY',
    name: `Opening balances - ${commodity.mnemonic}`,
    fk_commodity: commodity,
    description: `Account to store opening balances in ${commodity.mnemonic}`,
    parent: rootEquity,
  }).save();

  return equityAccount;
}
