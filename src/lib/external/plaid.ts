import { AccountType } from 'plaid';
import type { TransactionsSyncResponse } from 'plaid';

import { Account, Commodity } from '@/book/entities';

/**
 * Transform the response returned from transactionsSync to our entities.
 *  - If the currency exists we re-used, if not we create a new one.
 *  - If the account is a depository, the type is BANK. If credit 'CREDIT' and if
 *    loan then 'LIABILITY'. I'm aware there are more types, we can add them
 *    whenever is needed
 */
export async function createEntitiesFromData(data: TransactionsSyncResponse) {
  const { accounts } = data;

  await Promise.all(
    accounts.map(async (account) => {
      let commodity = await Commodity.findOneBy({
        namespace: 'CURRENCY',
        mnemonic: account.balances.iso_currency_code as string,
      });

      if (!commodity) {
        commodity = await Commodity.create({
          namespace: 'CURRENCY',
          mnemonic: account.balances.iso_currency_code as string,
        }).save();
      }

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

      await Account.create({
        guid: `plaid-${account.persistent_account_id}`,
        name: account.name,
        fk_commodity: commodity,
        type,
        description: 'Synced account',
        parent,
      }).save();
    }),
  );
}
