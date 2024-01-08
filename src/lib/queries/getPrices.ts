import { Price } from '@/book/entities';

/**
 * Retrieves the prices for a given commodity sorted by date
 */
export default async function getPrices(guid: string): Promise<Price[]> {
  const prices = await Price.find({
    where: {
      fk_commodity: {
        guid,
      },
    },
    order: {
      date: 'ASC',
    },
  });

  return prices;
}
