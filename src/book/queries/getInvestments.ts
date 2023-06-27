import { Account } from '../entities';
import { InvestmentAccount } from '../models';
import { PriceDB, PriceDBMap } from '../prices';

export async function getInvestments(mainCurrency: string): Promise<InvestmentAccount[]> {
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
            splits: true,
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
    account => new InvestmentAccount(
      account,
      mainCurrency,
      pricesMap,
    ),
  );
  const end = performance.now();
  console.log(`get investments: ${end - start}ms`);

  return investments;
}
