import type { Account } from '@/book/entities';

export function isInvestment(account: Account): boolean {
  if (['STOCK', 'MUTUAL'].includes(account.type)) {
    return true;
  }

  return false;
}

export function isAsset(account: Account): boolean {
  if (['ASSET', 'BANK', 'CASH', 'EQUITY'].includes(account.type)) {
    return true;
  }

  return false;
}

export function getAllowedSubAccounts(type: string): string[] {
  if (type === 'ROOT') {
    return ['ASSET', 'EXPENSE', 'INCOME', 'LIABILITY'];
  }

  if (type === 'ASSET') {
    return ['ASSET', 'BANK', 'CASH', 'EQUITY', 'STOCK', 'MUTUAL'];
  }

  return [type];
}
