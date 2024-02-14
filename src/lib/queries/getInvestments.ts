import { Account, Commodity, Split } from '@/book/entities';
import { InvestmentAccount } from '@/book/models';
import { PriceDBMap } from '@/book/prices';
import getPrices from '@/lib/queries/getPrices';

export async function getInvestments(
  accounts: Account[],
  mainCurrency: Commodity,
  splits: Split[],
): Promise<InvestmentAccount[]> {
  const investments = await Promise.all(
    accounts.map(account => initInvestment(
      account,
      mainCurrency,
      splits.filter(s => s.account.guid === account.guid),
    )),
  );

  return investments;
}

export async function initInvestment(
  account: Account,
  mainCurrency: Commodity,
  splits: Split[],
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
    splits,
    mainCurrency.mnemonic,
    pricesMap,
  );

  return investment;
}
