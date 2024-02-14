import type {
  FindOptionsWhere,
  FindOptionsRelations,
} from 'typeorm';

import { Account, Split } from '@/book/entities';

/**
 * Returns splits associated to the received account
 *
 * The splits are ordered by transaction date and quantity. This is so it's
 * easy to display the splits as the account ledger.
 */
export default async function getSplits(
  account: FindOptionsWhere<Account>,
  relations?: FindOptionsRelations<Split>,
): Promise<Split[]> {
  const splits = await Split.find({
    where: {
      fk_account: {
        ...account,
      },
    },
    relations: {
      ...relations,
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
