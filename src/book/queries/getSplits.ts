import { Split } from '@/book/entities';

/**
 * Returns the splits for a given account guid. The splits include
 * transaction.splits and account data. They are ordered by transaction date
 * and quantityNum so there's proper order to display the list in a timeline.
 */
export async function getSplits(guid: string): Promise<Split[]> {
  const start = performance.now();
  const splits = Split.find({
    where: {
      fk_account: {
        guid,
      },
    },
    relations: {
      fk_transaction: {
        splits: {
          fk_account: true,
        },
      },
      fk_account: true,
    },
    order: {
      fk_transaction: {
        date: 'DESC',
      },
      // This is so debit is always before credit
      // so we avoid negative amounts when display
      // partial totals
      quantityNum: 'ASC',
    },
  });
  const end = performance.now();
  console.log(`get splits: ${end - start}ms`);
  return splits;
}
