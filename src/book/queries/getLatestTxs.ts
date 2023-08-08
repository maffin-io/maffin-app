import { Transaction } from '@/book/entities';

export async function getLatestTxs(): Promise<Transaction[]> {
  const txs = await Transaction.find({
    relations: {
      splits: {
        fk_account: true,
      },
    },
    order: {
      date: 'DESC',
    },
    take: 5,
  });

  return txs;
}
