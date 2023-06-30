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
