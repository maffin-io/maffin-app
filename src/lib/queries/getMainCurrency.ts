import { Account, Commodity } from '@/book/entities';

/**
 * We consider the main currency to be the currency of the topmost
 * ASSET account
 */
export default async function getMainCurrency(): Promise<Commodity> {
  const assetRoot = await Account.findOneOrFail({
    where: {
      type: 'ASSET',
      parent: {
        type: 'ROOT',
      },
    },
    relations: {
      parent: true,
    },
  });
  return assetRoot.commodity;
}
