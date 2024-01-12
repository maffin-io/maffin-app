import { Account, Commodity } from '@/book/entities';
import { InvestmentAccount } from '@/book/models';
import { PriceDBMap } from '@/book/prices';
import getMainCurrency from '@/lib/queries/getMainCurrency';
import getPrices from '@/lib/queries/getPrices';

export async function getInvestments(): Promise<InvestmentAccount[]> {
  const mainCurrency = await getMainCurrency();
  const accounts = await Account.find({
    where: [
      { type: 'STOCK' },
      { type: 'MUTUAL' },
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
  });

  const investments = await Promise.all(
    accounts.map(account => initInvestment(account, mainCurrency)),
  );

  return investments;
}

export async function getInvestment(guid: string): Promise<InvestmentAccount> {
  const mainCurrency = await getMainCurrency();
  const account = await Account.findOneOrFail({
    where: { guid },
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
  });

  const investment = await initInvestment(account, mainCurrency);
  return investment;
}

async function initInvestment(
  account: Account,
  mainCurrency: Commodity,
): Promise<InvestmentAccount> {
  const prices = await getPrices({ from: account.commodity });

  let mainCurrencyPrices = new PriceDBMap();
  const investmentCurrency = prices.getInvestmentPrice(account.commodity.mnemonic).currency;
  if (investmentCurrency.guid !== mainCurrency.guid) {
    mainCurrencyPrices = await getPrices({
      from: investmentCurrency,
      to: mainCurrency,
    });
  }

  const pricesMap = new PriceDBMap([
    ...mainCurrencyPrices.prices,
    ...prices.prices,
  ]);
  const investment = new InvestmentAccount(
    account,
    mainCurrency.mnemonic,
    pricesMap,
  );

  return investment;
}
