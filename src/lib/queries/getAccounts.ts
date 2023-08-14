import { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

export default async function getAccounts(): Promise<AccountsMap> {
  const accounts = await Account.find();

  const accountsMap: AccountsMap = {};
  accounts.forEach(account => {
    if (account.type === 'ROOT' && !account.name.startsWith('Template')) {
      accountsMap.root = account;
    }
    accountsMap[account.guid] = account;
  });

  return accountsMap;
}
