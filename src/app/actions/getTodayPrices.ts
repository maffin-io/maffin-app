'use server';

import getPrices from '@/lib/external/yahoo';
import type { Price } from '@/lib/external/yahoo';
import { getRoles, verify } from '@/lib/jwt';

/**
 * Action to retrieve prices from an external API.
 *
 * It verifies the access token and if the user doesn't have the 'premium'
 * role, it will return empty without querying the prices.
 */
export default async function getTodayPrices({
  tickers,
  accessToken,
}: {
  tickers: string[],
  accessToken: string,
}): Promise<{ [ticker: string]: Price }> {
  await verify(accessToken);
  if (!getRoles(accessToken).isPremium) {
    return {};
  }

  const result = await getPrices(tickers);
  return result;
}
