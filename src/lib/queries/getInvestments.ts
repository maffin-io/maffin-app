import { Account } from '@/book/entities';
import { InvestmentAccount } from '@/book/models';
import { PriceDB, PriceDBMap } from '@/book/prices';
import getMainCurrency from '@/lib/queries/getMainCurrency';

export default async function getInvestments(): Promise<InvestmentAccount[]> {
  const mainCurrency = (await getMainCurrency()).mnemonic;
  const start = performance.now();
  const [accounts, todayPrices, mainCurrencyPrices] = await Promise.all([
    Account.find({
      where: [
        { type: 'STOCK' },
        { type: 'MUTUAL' },
      ],
      relations: {
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
      try {
        const investment = new InvestmentAccount(
          account,
          mainCurrency,
          pricesMap,
        );
        return investment;
      } catch (e) {
        throw new Error(`Failed to create investment from account ${account.guid}: ${e}`);
      }
    },
  );
  const end = performance.now();
  console.log(`get investments: ${end - start}ms`);

  return investments;
}
