import { Split } from '@/book/entities';

/**
 * Returns splits associated to the received account
 *
 * The splits are ordered by transaction date and quantity. This is so it's
 * easy to display the splits as the account ledger.
 */
export default async function getSplits(account: string): Promise<Split[]> {
  const splits = await Split.find({
    where: {
      fk_account: {
        guid: account,
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
        enterDate: 'DESC',
      },
      // This is so debit is always before credit
      // so we avoid negative amounts when display
      // partial totals
      quantityNum: 'ASC',
    },
  });

  return splits;
}
