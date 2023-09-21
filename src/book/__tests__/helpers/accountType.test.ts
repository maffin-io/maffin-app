import { Account } from '../../entities';
import {
  isInvestment,
  isAsset,
  isLiability,
  getAllowedSubAccounts,
  ASSET_ACCOUNTS,
  LIABILITY_ACCOUNTS,
} from '../../helpers/accountType';

describe('isInvestment', () => {
  it.each(
    ['STOCK', 'MUTUAL'],
  )('returns true for %s', (type) => {
    expect(isInvestment({ type } as Account)).toBe(true);
  });
});

describe('isAsset', () => {
  it.each(
    ASSET_ACCOUNTS,
  )('returns true for %s', (type) => {
    expect(isAsset({ type } as Account)).toBe(true);
  });
});

describe('isLiability', () => {
  it.each(
    LIABILITY_ACCOUNTS,
  )('returns true for %s', (type) => {
    expect(isLiability({ type } as Account)).toBe(true);
  });
});

describe('getAllowedSubAccounts', () => {
  it.each([
    ['ROOT', ['ASSET', 'EXPENSE', 'INCOME', 'LIABILITY', 'EQUITY']],
    ['ASSET', ['ASSET', 'BANK', 'CASH', 'STOCK', 'MUTUAL', 'RECEIVABLE']],
    ['LIABILITY', ['LIABILITY', 'CREDIT', 'PAYABLE']],
    ['INCOME', ['INCOME']],
    ['EXPENSE', ['EXPENSE']],
  ])('returns expected subaccounts for %s', (type, expected) => {
    expect(getAllowedSubAccounts(type)).toEqual(expected);
  });
});
