import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';
import mapAccounts from '@/helpers/mapAccounts';

export default function visibleAccountGuids(
  guids: string[],
  accounts: Account[] | undefined,
): string[] {
  if (!accounts) {
    return guids;
  }

  const accountsMap = mapAccounts(accounts);
  return guids.filter(guid => !accountsMap[guid]?.hidden);
}

export function visibleChildIds(accounts: AccountsMap, parent: Account): string[] {
  return parent.childrenIds.filter(childId => !accounts[childId]?.hidden);
}
