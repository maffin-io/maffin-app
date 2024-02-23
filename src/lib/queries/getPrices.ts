import { Interval } from 'luxon';
import { Raw } from 'typeorm';

import { Commodity, Price } from '@/book/entities';
import { PriceDBMap } from '@/book/prices';

/**
 * Retrieve a list of prices filtered by commodity (from) and/or currency (to).
 */
export default async function getPrices({
  from,
  to,
  interval,
}: {
  from?: Commodity,
  to?: Commodity,
  interval?: Interval,
}): Promise<PriceDBMap> {
  const prices = await Price.find({
    where: [
      {
        fk_commodity: {
          guid: from?.guid,
        },
        fk_currency: {
          guid: to?.guid,
        },
        date: (
          interval && Raw((alias) => `${alias} <= :date`, { date: interval.start?.toISODate() })
        ) || undefined,
      },
      {
        fk_commodity: {
          guid: from?.guid,
        },
        fk_currency: {
          guid: to?.guid,
        },
        date: (
          interval && Raw((alias) => `${alias} <= :date`, { date: interval.end?.toISODate() })
        ) || undefined,
      },
    ],
  });

  let reversePrices: Price[] = [];
  if (!from) {
    reversePrices = prices.filter(p => p.commodity.namespace === 'CURRENCY').map(p => {
      const price = Price.create({
        guid: p.guid,
        fk_commodity: p.fk_currency,
        fk_currency: p.fk_commodity,
        date: p.date,
      });
      price.value = 1 / p.value;
      return price;
    });
  } else if (from?.namespace === 'CURRENCY') {
    reversePrices = await Price.find({
      where: [
        {
          fk_commodity: {
            guid: to?.guid,
            namespace: 'CURRENCY',
          },
          fk_currency: {
            guid: from?.guid,
          },
          date: (
            interval && Raw((alias) => `${alias} <= :date`, { date: interval.start?.toISODate() })
          ) || undefined,
        },
        {
          fk_commodity: {
            guid: to?.guid,
            namespace: 'CURRENCY',
          },
          fk_currency: {
            guid: from?.guid,
          },
          date: (
            interval && Raw((alias) => `${alias} <= :date`, { date: interval.end?.toISODate() })
          ) || undefined,
        },
      ],
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
