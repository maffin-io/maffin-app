import { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

/**
 * Returns all the accounts with the given relations. This function
 * is costly as Account.ts loads the commodities and parent/children ids.
 *
 * Moreover, if you pass relations like splits, it will take way longer
 */
export default async function getAccounts(): Promise<AccountsMap> {
  const accounts = await Account.find({
    relations: {
      splits: {
        fk_transaction: true,
      },
    },
    order: {
      splits: {
        fk_transaction: {
          date: 'DESC',
        },
        // This is so debit is always before credit
        // so we avoid negative amounts when display
        // partial totals
        quantityNum: 'ASC',
      },
    },
  });

  const accountsMap: AccountsMap = {};
  accounts.forEach(account => { accountsMap[account.guid] = account; });

  return accountsMap;
}
