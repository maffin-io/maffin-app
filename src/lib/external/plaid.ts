import { AccountType } from 'plaid';
import type { TransactionsSyncResponse } from 'plaid';

import {
  Account,
  BankConfig,
  Commodity,
} from '@/book/entities';
import { MaffinError } from '@/helpers/errors';

/**
 * Check if the institution already exists. If it does we don't let the user
 * create another one as Plaid charges for each config Item that is create
 */
export async function createConfig(guid: string): Promise<BankConfig> {
  const config = await BankConfig.findOneBy({ guid });

  if (config) {
    throw new MaffinError(
      'This institution is already linked',
      'PLAID_DUPLICATE',
    );
  }

  return BankConfig.create({
    guid,
    token: '',
  }).save();
}

/**
 * Given a transactions response from Plaid, creates the accounts
 * and links them to the bank config object
 */
export async function createAccounts(
  config: BankConfig,
  accounts: TransactionsSyncResponse['accounts'],
): Promise<Account[]> {
  const accs = await Promise.all(
    accounts.map(async (account) => {
      let type = 'BANK';
      let parent = await Account.findOneByOrFail({
        type: 'ASSET',
        parent: {
          type: 'ROOT',
        },
      });
      if ([AccountType.Credit, AccountType.Loan].includes(account.type)) {
        type = account.type === AccountType.Credit ? 'CREDIT' : 'LIABILITY';
        parent = await Account.findOneByOrFail({
          type: 'LIABILITY',
          parent: {
            type: 'ROOT',
          },
        });
      }

      const currency = await getOrCreateCurrency(account.balances.iso_currency_code as string);
      return Account.create({
        guid: `${account.account_id}`,
        name: account.name,
        fk_commodity: currency,
        type,
        description: 'Online banking account',
        parent,
        fk_config: config,
      }).save();
    }),
  );

  return accs;
}

async function getOrCreateCurrency(mnemonic: string): Promise<Commodity> {
  let currency = await Commodity.findOneBy({
    namespace: 'CURRENCY',
    mnemonic,
  });

  if (!currency) {
    currency = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic,
    }).save();
  }

  return currency;
}
