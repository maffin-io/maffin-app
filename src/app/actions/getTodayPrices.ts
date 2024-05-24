'use server';

import getPrices from '@/lib/yahoo';
import type { Price as PriceInfo } from '@/lib/yahoo';

export default async function getTodayPrices(
  tickers: string[],
): Promise<{ [ticker: string]: PriceInfo }> {
  const result = await getPrices(tickers);
  return result;
}
