import { toAmountWithScale, toFixed } from '@/helpers/number';

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
