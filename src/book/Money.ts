import * as currencies from '@dinero.js/currencies';
import type { Currency as DineroCurrency } from 'dinero.js';
import * as djs from 'dinero.js';

import { toAmountWithScale, moneyToString } from '@/helpers/number';

export default class Money {
  private _raw: djs.Dinero<number>;

  /**
   * A wrapper class for dinero object to reduce verbosity and overhead. The constructor
   * checks for how many decimals the amount has and calculates the scale automatically.
   *
   * @param amount - The amount to be considered in the money object. Can be a float
   * @param currency - The currency
   * @param scale - Number representing custom scale. Default is 0, if passed differently, that one
   * is taken into account
   */
  constructor(amount: number, currency: string, scale?: number) {
    const dineroCurrency = toCurrency(currency);

    if (scale === undefined) {
      const { amount: newAmount, scale: newScale } = toAmountWithScale(amount);
      this._raw = djs.dinero({
        currency: dineroCurrency,
        amount: newAmount,
        scale: newScale,
      });
    } else {
      this._raw = djs.dinero({
        currency: dineroCurrency,
        amount,
        scale,
      });
    }
  }

  get currency(): string {
    return djs.toSnapshot(this._raw).currency.code;
  }

  get raw(): djs.Dinero<number> {
    return this._raw;
  }

  /**
   * Represents the money object as a string with the currency standardizing
   * the scale to 2 as a default. If the scale is passed then it uses that.
   */
  toString(scale = 2): string {
    return djs.toDecimal(
      djs.transformScale(this._raw, scale),
      ({ value, currency }) => `${value} ${currency.code}`,
    );
  }

  /**
   * Represents the money object as a string with the currency standardizing
   * the scale to 2 as a default. If the scale is passed then it uses that.
   *
   * The result is a localized string with the currency as a symbol
   */
  format(scale = 2): string {
    return djs.toDecimal(
      djs.transformScale(this._raw, scale),
      ({ value, currency }) => moneyToString(Number(value), currency.code),
    );
  }

  toNumber(): number {
    return parseFloat(djs.toDecimal(this._raw));
  }

  isNegative(): boolean {
    return djs.isNegative(this._raw);
  }

  isZero(): boolean {
    return djs.isZero(this._raw);
  }

  /**
   * Adds b to the current object and returns a new one with the result
   *
   * @param b - Money to be added
   * @returns - Money with result
   */
  add(b: Money): Money {
    const result = djs.toSnapshot(djs.add(b.raw, this.raw));
    return new Money(result.amount, this.currency, result.scale);
  }

  /**
   * Subtracts b to the current object and returns a new one with the result
   *
   * @param b - Money to be subtracted
   * @returns - Money with result
   */
  subtract(b: Money): Money {
    const result = djs.toSnapshot(djs.subtract(this.raw, b.raw));
    return new Money(result.amount, this.currency, result.scale);
  }

  /**
   * Multiplies b to the current object and returns a new one with the result
   * Initially, we try to multiply without transforming b but sometimes dinerojs
   * returns that it is an invalid amount (I have no idea why). If it fails, then
   * we transform b to `amountWithScale` and multiply with that.
   *
   * @param b - amount to be multiplied to in scale 0
   * @returns - Money with result
   */
  multiply(b: number): Money {
    let result;

    try {
      result = djs.multiply(this.raw, b);
    } catch {
      result = djs.multiply(this.raw, toAmountWithScale(b));
    }

    const snapshot = djs.toSnapshot(result);
    return new Money(snapshot.amount, this.currency, snapshot.scale);
  }

  /**
   * Checks for equality with b by comparing amount and currency
   *
   * @returns - boolean
   */
  equals(b: Money): boolean {
    return djs.equal(this._raw, b._raw);
  }

  /**
   * Converts a Money object to the currency specified
   *
   * @param to - Money object containing the rate to
   */
  convert(
    to: string,
    rate: number,
  ): Money {
    const rates = {
      [to]: {
        ...toAmountWithScale(rate),
      },
    };
    const currency = toCurrency(to);

    try {
      // @ts-ignore
      const result = djs.toSnapshot(djs.convert(this.raw, currency, rates));
      return new Money(result.amount, currency.code, result.scale);
    } catch (e) {
      throw new Error(`Error converting ${this.format()} to ${to} with rates ${JSON.stringify(rates)}: ${e}`);
    }
  }
}

function toCurrency(currency: string): DineroCurrency<number> {
  // @ts-ignore
  let dineroCurrency = currencies[currency];
  if (!dineroCurrency) {
    dineroCurrency = {
      code: currency,
      base: 10,
      exponent: 2,
    };
  }
  return dineroCurrency;
}
