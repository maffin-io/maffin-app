import { Account } from '../../entities';
import {
  isInvestment,
  isAsset,
  isLiability,
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
