import { Commodity, Price } from '@/book/entities';
import { PriceDBMap } from '@/book/prices';

/**
 * Retrieve a list of prices filtered by commodity (from) and/or currency (to).
 */
export default async function getPrices({
  from,
  to,
}: {
  from?: Commodity,
  to?: Commodity,
}): Promise<PriceDBMap> {
  const prices = await Price.find({
    where: {
      fk_commodity: {
        guid: from?.guid,
      },
      fk_currency: {
        guid: to?.guid,
      },
    },
  });

  let reversePrices: Price[] = [];
  if (from?.namespace === 'CURRENCY') {
    reversePrices = await Price.find({
      where: {
        fk_commodity: {
          guid: to?.guid,
          namespace: 'CURRENCY',
        },
        fk_currency: {
          guid: from?.guid,
        },
      },
    });
    reversePrices.forEach((price, i) => {
      const commodity = price.fk_commodity;
      const currency = price.fk_currency;
      reversePrices[i].value = 1 / price.value;
      reversePrices[i].fk_commodity = currency;
      reversePrices[i].fk_currency = commodity;
    });
  }

  return new PriceDBMap([
    ...prices,
    ...reversePrices,
  ]);
}
