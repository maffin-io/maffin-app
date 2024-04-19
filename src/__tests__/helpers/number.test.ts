import { toAmountWithScale, toFixed, moneyToString } from '@/helpers/number';

describe('toAmountWithScale', () => {
  it('works with 0', () => {
    expect(toAmountWithScale(0)).toEqual({
      amount: 0,
      scale: 0,
    });
  });

  it('returns scale 0 for int', () => {
    expect(toAmountWithScale(25)).toEqual({
      amount: 25,
      scale: 0,
    });
  });

  it('works for 2 decimals', () => {
    expect(toAmountWithScale(25.13)).toEqual({
      amount: 2513,
      scale: 2,
    });
  });

  it('works for long decimals', () => {
    expect(toAmountWithScale(25.131847139)).toEqual({
      amount: 25131847139,
      scale: 9,
    });
  });
});

describe('toFixed', () => {
  it('defaults to 2 decimals', () => {
    expect(toFixed(2.2536)).toEqual(2.25);
  });

  it('uses passed decimals', () => {
    expect(toFixed(2.2536, 3)).toEqual(2.254);
  });

  it('works when decimals higher', () => {
    expect(toFixed(2.2536, 10)).toEqual(2.2536);
  });
});

describe('moneyToString', () => {
  it('returns string as expected', () => {
    expect(moneyToString(1234567.89, 'EUR')).toEqual('€1,234,567.89');
  });

  it('uses EUR by default if empty currency passed', () => {
    expect(moneyToString(1234567.89, '')).toEqual('€1,234,567.89');
  });

  it('returns as expected when not a currency', () => {
    expect(moneyToString(1234567.89, 'NVDA')).toEqual('1,234,567.89 NVDA');
  });

  it('rounds to specific decimals', () => {
    expect(moneyToString(1.9876389, 'EUR', 5)).toEqual('€1.98764');
  });

  it('rounds to specific decimals when not a currency', () => {
    expect(moneyToString(1.9876389, 'NVDA', 5)).toEqual('1.98764 NVDA');
  });
});
