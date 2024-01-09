import { Price } from '@/book/entities';

/**
 * Retrieve a list of prices filtered by commodity (from) and/or currency (to).
 */
export default async function getPrices({
  from,
  to,
}: {
  from?: string,
  to?: string,
}): Promise<Price[]> {
  const prices = await Price.find({
    where: {
      fk_commodity: {
        guid: from,
      },
      fk_currency: {
        guid: to,
      },
    },
    order: {
      date: 'ASC',
    },
  });

  return prices;
}
