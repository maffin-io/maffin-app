import { Commodity, Price } from '../entities';
import Money, { convert } from '../Money';
import { PriceDBMap } from '../prices';

describe('Money', () => {
  let money: Money;

  beforeEach(() => {
    money = new Money(100, 'EUR'); // This represents 1 EUR
  });

  describe('initialisation', () => {
    it('initializes with int', () => {
      expect(new Money(100, 'EUR').toString()).toEqual('100.00 EUR');
    });

    it('initializes with float', () => {
      expect(new Money(1.235566134, 'EUR').toString()).toEqual('1.23 EUR');
    });

    it('initializes with custom scale', () => {
      expect(new Money(123, 'EUR', 2).toString()).toEqual('1.23 EUR');
    });

    it('initializes with custom scale when float', () => {
      expect(new Money(1.0606252450000001e+21, 'EUR', 17).toString()).toEqual('10606.25 EUR');
    });
  });

  describe('format', () => {
    it('localises money', () => {
      money = new Money(100, 'USD', 3);
      expect(money.format()).toEqual('$0.10');
    });

    it('works with commodities', () => {
      money = new Money(100.10, 'GOOGL');
      expect(money.format()).toEqual('100.1 GOOGL');
    });
  });

  describe('toNumber', () => {
    it('returns number as expected', () => {
      expect(money.toNumber()).toEqual(100);
    });

    it('fixes scale to 2', () => {
      money = new Money(100, 'USD', 3);
      expect(money.toNumber()).toEqual(0.1);
    });
  });

  describe('currency', () => {
    it('returns currency correctly', () => {
      expect(money.currency).toEqual('EUR');
    });
  });

  describe('isNegative', () => {
    it('returns true for positive', () => {
      expect(money.isNegative()).toBe(false);
    });

    it('returns false for positive', () => {
      money = new Money(-100, 'EUR'); // This represents -1 EUR
      expect(money.isNegative()).toBe(true);
    });
  });

  describe('add', () => {
    it('adds as expected', () => {
      const b = new Money(100, 'EUR');
      const result = money.add(b);
      expect(result.toString()).toEqual('200.00 EUR');
    });

    it('adds big decimals', () => {
      const b = new Money(7590.297130000002, 'EUR');
      const c = new Money(3015.95, 'EUR');

      expect(b.add(c).toString()).toEqual('10606.24 EUR');
    });
  });

  describe('subtract', () => {
    it('subtracts as expected', () => {
      const b = new Money(50, 'EUR');
      const result = money.subtract(b);
      expect(result.toString()).toEqual('50.00 EUR');
    });

    it('goes to 0', () => {
      const b = new Money(100, 'EUR');
      const result = money.subtract(b);
      expect(result.toString()).toEqual('0.00 EUR');
    });

    it('subtracts into negative', () => {
      const b = new Money(200, 'EUR');
      const result = money.subtract(b);
      expect(result.toString()).toEqual('-100.00 EUR');
    });
  });

  describe('multiply', () => {
    it('multiplies as expected', () => {
      const result = money.multiply(2);
      expect(result.toString()).toEqual('200.00 EUR');
    });

    it('multiplies negative numbers as expected', () => {
      const result = money.multiply(-2);
      expect(result.toString()).toEqual('-200.00 EUR');
    });

    it('multiplies decimals', () => {
      const result = money.multiply(1.5);
      expect(result.toString()).toEqual('150.00 EUR');
    });

    it('multiplies negative decimals', () => {
      money = new Money(-122.86, 'EUR');
      const result = money.multiply(8.14);
      expect(result.toString()).toEqual('-1000.09 EUR');
    });

    it('multiplies long decimals', () => {
      money = new Money(122.8501, 'EUR');
      const result = money.multiply(8.140001514040282);
      expect(result.toString()).toEqual('1000.00 EUR');
    });

    it('multiplies long negative decimals', () => {
      money = new Money(-122.8501, 'EUR');
      const result = money.multiply(8.140001514040282);
      expect(result.toString()).toEqual('-1000.00 EUR');
    });
  });

  describe('equal', () => {
    it('returns true when same', () => {
      const b = new Money(100, 'EUR');
      expect(money.equals(b)).toBe(true);
    });

    it('returns false when amount not the same', () => {
      const b = new Money(50, 'EUR');
      expect(money.equals(b)).toBe(false);
    });

    it('returns false when currency not the same', () => {
      const b = new Money(100, 'USD');
      expect(money.equals(b)).toBe(false);
    });
  });

  describe('convert', () => {
    it('converts with different currency', () => {
      money = new Money(100, 'USD'); // This represents 1 USD
      expect(money.convert('EUR', 0.94).toString()).toEqual('94.00 EUR');
    });

    it('converts with different currency long number', () => {
      money = new Money(18546718, 'USD'); // This represents 185467.18 USD
      expect(money.convert('EUR', 0.94).toString()).toEqual('17433914.92 EUR');
    });

    it('converts with multiple decimals', () => {
      money = new Money(11816, 'USD'); // This represents 185467.18 USD
      expect(money.convert('EUR', 0.8499).toString()).toEqual('10042.41 EUR');
    });

    it('converts with same currency', () => {
      expect(money.convert('EUR', 0.94).toString()).toEqual('94.00 EUR');
    });
  });

  describe('abs', () => {
    it('returns abs for positive', () => {
      money = new Money(100, 'EUR');
      expect(money.abs().toString()).toEqual('100.00 EUR');
    });

    it('returns abs for negative', () => {
      money = new Money(-100, 'EUR');
      expect(money.abs().toString()).toEqual('100.00 EUR');
    });
  });
});

describe('convert', () => {
  let eur: Commodity;
  let usd: Commodity;
  let prices: PriceDBMap;

  beforeEach(() => {
    prices = new PriceDBMap([]);
    eur = { guid: 'eur', mnemonic: 'EUR', namespace: 'CURRENCY' } as Commodity;
    usd = { guid: 'usd', mnemonic: 'USD', namespace: 'CURRENCY' } as Commodity;
  });

  it('converts as expected', () => {
    const rate = new Price();
    rate.value = 0.987;
    rate.fk_commodity = usd;
    rate.fk_currency = eur;
    jest.spyOn(prices, 'getPrice').mockReturnValue(rate);

    const money = convert(
      new Money(10, 'USD'),
      usd,
      eur,
      prices,
    );

    expect(money.toString()).toEqual('9.87 EUR');
  });

  it('converts as expected when investment', () => {
    const ticker = { guid: 'ticker', mnemonic: 'TICKER', namespace: 'STOCK' } as Commodity;

    const rate = new Price();
    rate.value = 100;
    rate.fk_commodity = ticker;
    rate.fk_currency = eur;
    jest.spyOn(prices, 'getInvestmentPrice').mockReturnValue(rate);

    const money = convert(
      new Money(10, 'TICKER'),
      ticker,
      eur,
      prices,
    );

    expect(money.toString()).toEqual('1000.00 EUR');
  });

  it('converts as expected when investment with different currency', () => {
    const ticker = { guid: 'ticker', mnemonic: 'TICKER', namespace: 'STOCK' } as Commodity;

    const trate = new Price();
    trate.value = 100;
    trate.fk_commodity = ticker;
    trate.fk_currency = usd;
    jest.spyOn(prices, 'getInvestmentPrice').mockReturnValue(trate);

    const rate = new Price();
    rate.value = 0.987;
    rate.fk_commodity = usd;
    rate.fk_currency = eur;
    jest.spyOn(prices, 'getPrice').mockReturnValue(rate);

    const money = convert(
      new Money(10, 'TICKER'),
      ticker,
      eur,
      prices,
    );

    expect(money.toString()).toEqual('987.00 EUR');
  });
});
