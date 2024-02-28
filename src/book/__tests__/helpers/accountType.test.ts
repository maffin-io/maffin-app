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
  it('returns true for INVESTMENT', () => {
    expect(isInvestment({ type: 'INVESTMENT' } as Account)).toBe(true);
  });
});

describe('isAsset', () => {
  it.each(
    ASSET_ACCOUNTS,
  )('returns true for %s account', (type) => {
    expect(isAsset({ type } as Account)).toBe(true);
  });

  it.each(
    ASSET_ACCOUNTS,
  )('returns true for %s string', (type) => {
    expect(isAsset(type)).toBe(true);
  });
});

describe('isLiability', () => {
  it.each(
    LIABILITY_ACCOUNTS,
  )('returns true for %s account', (type) => {
    expect(isLiability({ type } as Account)).toBe(true);
  });

  it.each(
    LIABILITY_ACCOUNTS,
  )('returns true for %s string', (type) => {
    expect(isLiability(type)).toBe(true);
  });
});

describe('getAllowedSubAccounts', () => {
  it.each([
    ['ROOT', ['ASSET', 'EXPENSE', 'INCOME', 'LIABILITY', 'EQUITY']],
    ['ASSET', ['ASSET', 'BANK', 'CASH', 'FIXED', 'INVESTMENT', 'RECEIVABLE']],
    ['LIABILITY', ['LIABILITY', 'CREDIT', 'PAYABLE']],
    ['INCOME', ['INCOME']],
    ['EXPENSE', ['EXPENSE']],
  ])('returns expected subaccounts for %s', (type, expected) => {
    expect(getAllowedSubAccounts(type)).toEqual(expected);
  });
});
