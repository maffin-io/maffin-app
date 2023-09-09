import type { Account } from '@/book/entities';

export const ASSET_ACCOUNTS = ['ASSET', 'BANK', 'CASH', 'STOCK', 'MUTUAL', 'RECEIVABLE'];
export const LIABILITY_ACCOUNTS = ['LIABILITY', 'CREDIT', 'PAYABLE'];

export function isInvestment(account: Account): boolean {
  if (['STOCK', 'MUTUAL'].includes(account.type)) {
    return true;
  }

  return false;
}

export function isAsset(account: Account): boolean {
  if (ASSET_ACCOUNTS.includes(account.type)) {
    return true;
  }

  return false;
}

export function isLiability(account: Account): boolean {
  if (LIABILITY_ACCOUNTS.includes(account.type)) {
    return true;
  }

  return false;
}

export function getAllowedSubAccounts(type: string): string[] {
  if (type === 'ROOT') {
    return ['ASSET', 'EXPENSE', 'INCOME', 'LIABILITY', 'EQUITY'];
  }

  if (type === 'ASSET') {
    return ASSET_ACCOUNTS;
  }

  if (type === 'LIABILITY') {
    return LIABILITY_ACCOUNTS;
  }

  return [type];
}
