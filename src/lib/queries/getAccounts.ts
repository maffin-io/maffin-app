import { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

/**
 * Returns all the accounts with their splits and transactions. The splits
 * are ordered by transaction date and quantity.
 *
 * This query is costly and cost increases with the number of splits/accounts/transactions
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
  accounts.forEach(account => {
    if (account.type === 'ROOT' && !account.name.startsWith('Template')) {
      accountsMap.root = account;
    }
    accountsMap[account.guid] = account;
  });

  return accountsMap;
}
