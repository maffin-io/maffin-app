import { Account } from '../../entities';
import { isInvestment, isAsset } from '../../helpers/accountType';

describe('isInvestment', () => {
  it.each(
    ['STOCK', 'MUTUAL'],
  )('returns true for %s', (type) => {
    expect(isInvestment({ type } as Account)).toBe(true);
  });
});

describe('isAsset', () => {
  it.each(
    ['ASSET', 'BANK', 'CASH', 'EQUITY'],
  )('returns true for %s', (type) => {
    expect(isAsset({ type } as Account)).toBe(true);
  });
});
