import { Account } from '@/book/entities';
import { InvestmentAccount } from '@/book/models';
import { PriceDB, PriceDBMap } from '@/book/prices';
import getMainCurrency from '@/lib/queries/getMainCurrency';

export default async function getInvestments(
  guid?: string,
): Promise<InvestmentAccount[] | InvestmentAccount> {
  const mainCurrency = (await getMainCurrency()).mnemonic;
  const [accounts, todayPrices, mainCurrencyPrices] = await Promise.all([
    Account.find({
      where: [
        { guid, type: 'STOCK' },
        { guid, type: 'MUTUAL' },
      ],
      relations: {
        // This is very similar to `getSplits` query. In the future
        // we may want to try to re-use it
        splits: {
          fk_transaction: {
            splits: {
              fk_account: true,
            },
          },
        },
      },
      order: {
        splits: {
          fk_transaction: {
            date: 'ASC',
          },
        },
      },
    }),
    PriceDB.getTodayQuotes(),
    PriceDB.getHistory(mainCurrency),
  ]);

  const pricesMap = new PriceDBMap([
    ...Object.values(mainCurrencyPrices.map),
    ...Object.values(todayPrices.map),
  ]);
  const investments = accounts.map(
    account => {
      const investment = new InvestmentAccount(
        account,
        mainCurrency,
        pricesMap,
      );
      return investment;
    },
  );

  if (guid) {
    return investments[0];
  }
  return investments;
}
