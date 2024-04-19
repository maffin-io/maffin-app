/**
 * Given a floating point number, it returns the
 * amount and scale. For example with 10.25 it would return
 *
 * {
 *    amount: 1025,
 *    scale: 2,
 * }
 *
 * @param n - number to be transformed
 * @return - object with amount and scale
 */
export function toAmountWithScale(n: number): {
  amount: number,
  scale: number
} {
  const [int, decimals] = n.toString().split('.');
  const scale = decimals ? decimals.length : 0;
  const amount = parseInt([int, decimals].join(''), 10);

  return {
    amount,
    scale,
  };
}

/**
 * Transform the given number to the fixed amount of decimals.
 * It does some automatic rounding sourced from the toFixed
 * javascript function
 *
 * @param n - number to be transformed
 * @returns - resulting number
 */
export function toFixed(n: number, decimals = 2): number {
  return parseFloat(n.toFixed(decimals));
}

export function moneyToString(n: number, currency: string, decimals = 2): string {
  try {
    return n.toLocaleString(navigator.language, {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: decimals,
    });
  } catch {
    return `${n.toLocaleString(navigator.language, {
      maximumFractionDigits: decimals,
    })} ${currency}`;
  }
}
