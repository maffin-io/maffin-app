import type { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';
import mapAccounts from '@/helpers/mapAccounts';

export default function visibleAccountGuids(
  guids: string[],
  accounts: Account[] | undefined,
  includeGuids: string[] = [],
): string[] {
  if (!accounts) {
    return guids;
  }

  const includeSet = new Set(includeGuids);
  const accountsMap = mapAccounts(accounts);
  return guids.filter(
    guid => includeSet.has(guid) || !accountsMap[guid]?.hidden,
  );
}

export function visibleChildIds(accounts: AccountsMap, parent: Account): string[] {
  return parent.childrenIds.filter(childId => !accounts[childId]?.hidden);
}
