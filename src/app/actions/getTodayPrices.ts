'use server';

import getPrices from '@/lib/external/yahoo';
import type { Price } from '@/lib/external/yahoo';

export default async function getTodayPrices(
  tickers: string[],
): Promise<{ [ticker: string]: Price }> {
  const result = await getPrices(tickers);
  return result;
}
