import Money from '@/book/Money';
import { Commodity, Split } from '@/book/entities';
import type { Account } from '@/book/entities';
import mapAccounts from '@/helpers/mapAccounts';
import type { AccountsMap } from '@/types/book';
import type { PriceDBMap } from '@/book/prices';

export default async function getAccountsTotals(
  accounts: Account[],
  prices: PriceDBMap,
): Promise<{ [guid: string]: Money }> {
  const rows: { total: number, accountId: string, mnemonic: string }[] = await Split
    .query(`
      SELECT
        SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) as total,
        splits.account_guid as accountId
      FROM splits
      JOIN accounts as account ON splits.account_guid = account.guid
      GROUP BY 
        accountId
      HAVING SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) != 0
    `);

  const accountsMap = mapAccounts(accounts);
  const totals: { [guid: string]: Money } = {};

  rows.forEach(row => {
    totals[row.accountId] = new Money(row.total, accountsMap[row.accountId].mnemonic);
  });

  accountsMap.type_root.childrenIds.forEach((childId: string) => {
    totals[childId] = aggregateTotals(
      childId,
      accountsMap,
      prices,
      totals,
    );
  });

  return totals;
}

function aggregateTotals(
  guid: string,
  accounts: AccountsMap,
  prices: PriceDBMap,
  totals: { [guid: string]: Money },
) {
  const current = accounts[guid];
  current.childrenIds.forEach((childId: string) => {
    totals[current.guid] = (
      totals[current.guid]
      || new Money(0, current.commodity.mnemonic)
    ).add(
      convertToParentCommodity(
        aggregateTotals(childId, accounts, prices, totals),
        accounts[childId].commodity,
        current.commodity,
        prices,
      ),
    );
  });

  totals[current.guid] = totals[current.guid] || new Money(0, current.commodity.mnemonic);

  return totals[current.guid] || new Money(0, current.commodity.mnemonic);
}

/**
 * Given a Money amount it converts it to the specified currency in parameter
 * to.
 *
 * If the passed commodity in from is an investment, we retrieve the price of the
 * stock and if the currency of the stock doesn't match the specified currency,
 * we re-convert again
 */
function convertToParentCommodity(
  amount: Money,
  from: Commodity,
  to: Commodity,
  prices: PriceDBMap,
): Money {
  let rate = 1;
  let currency = from;

  if (currency.namespace !== 'CURRENCY') {
    const stockPrice = prices.getInvestmentPrice(
      currency.mnemonic,
    );
    rate = stockPrice.value;
    currency = stockPrice.currency;
  }
  if (currency.guid !== to.guid) {
    rate *= prices.getPrice(
      currency.mnemonic,
      to.mnemonic,
    ).value;
  }

  return amount.convert(to.mnemonic, rate);
}
