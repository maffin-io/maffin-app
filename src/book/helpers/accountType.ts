import type { Account } from '@/book/entities';

export const ASSET_ACCOUNTS = [
  'ASSET',
  'BANK',
  'CASH',
  'FIXED',
  'INVESTMENT',
  'RECEIVABLE',
];
export const LIABILITY_ACCOUNTS = ['LIABILITY', 'CREDIT', 'PAYABLE'];

export function isInvestment(account: Account): boolean {
  if (account.type === 'INVESTMENT') {
    return true;
  }

  return false;
}

export function isAsset(account: Account | string): boolean {
  if (
    ASSET_ACCOUNTS.includes(account as string)
      || ASSET_ACCOUNTS.includes((account as Account).type)
  ) {
    return true;
  }

  return false;
}

export function isLiability(account: Account | string): boolean {
  if (
    LIABILITY_ACCOUNTS.includes(account as string)
      || LIABILITY_ACCOUNTS.includes((account as Account).type)
  ) {
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
