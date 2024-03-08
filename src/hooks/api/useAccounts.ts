import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { Account } from '@/book/entities';
import fetcher from './fetcher';

export function useAccount(guid: string): UseQueryResult<Account | undefined> {
  const result = useAccounts<Account | undefined>(
    (data => data.find(a => a.guid === guid)),
  );

  return result;
}

export function useAccounts<TData = Account[]>(
  select?: (data: Account[]) => TData,
): UseQueryResult<TData> {
  const result = useQuery({
    queryKey: [...Account.CACHE_KEY],
    queryFn: fetcher(
      async () => {
        const accounts = await Account.find();
        const root = accounts.find(a => a.type === 'ROOT') as Account;
        setAccountPaths(root, accounts);
        return accounts;
      },
      Account.CACHE_KEY,
    ),
    select,
    networkMode: 'always',
  });

  return result;
}

function setAccountPaths(current: Account, accounts: Account[]) {
  const parent = accounts.find(a => a.guid === current.parentId);
  if (!parent || parent.type === 'ROOT') {
    current.path = current.name;
  } else {
    current.path = `${parent.path}:${current.name}`;
  }

  current.childrenIds.forEach(childId => {
    const account = accounts.find(a => a.guid === childId) as Account;
    setAccountPaths(account, accounts);
  });
}
