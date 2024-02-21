import { DateTime } from 'luxon';

import Money from '@/book/Money';
import { Account, Commodity } from '@/book/entities';
import type { AccountsTotals, AccountsMap } from '@/types/book';
import type { PriceDBMap } from '@/book/prices';
import mapAccounts from './mapAccounts';

/**
 * Given an AccountsTotal, aggregate the totals of the children into
 * their the account identified by 'guid'.
 *
 * If the children have different commodities, convert
 * them accordingly.
 */
export default function aggregateChildrenTotals(
  guid: string,
  accounts: Account[],
  prices: PriceDBMap,
  selectedDate: DateTime,
  totals: AccountsTotals,
): AccountsTotals {
  const accountsMap = mapAccounts(accounts);
  const aggregatedTotals: AccountsTotals = {};
  accountsMap[guid].childrenIds.forEach((childId: string) => {
    aggregate(
      childId,
      accountsMap,
      prices,
      selectedDate,
      totals,
      aggregatedTotals,
    );

    aggregatedTotals[`type_${accountsMap[childId].type.toLowerCase()}`] = aggregatedTotals[childId];
  });

  return aggregatedTotals;
}

function aggregate(
  guid: string,
  accounts: AccountsMap,
  prices: PriceDBMap,
  selectedDate: DateTime,
  totals: AccountsTotals,
  aggregatedTotals: AccountsTotals,
): Money {
  const current = accounts[guid];
  aggregatedTotals[current.guid] = totals[current.guid] || new Money(0, current.commodity.mnemonic);

  current.childrenIds.forEach((childId: string) => {
    aggregatedTotals[current.guid] = aggregatedTotals[current.guid].add(
      convertToParentCommodity(
        aggregate(childId, accounts, prices, selectedDate, totals, aggregatedTotals),
        accounts[childId].commodity,
        current.commodity,
        prices,
        selectedDate,
      ),
    );
  });

  return aggregatedTotals[current.guid];
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
  selectedDate: DateTime,
): Money {
  let rate = 1;
  let currency = from;

  if (currency.namespace !== 'CURRENCY') {
    const stockPrice = prices.getInvestmentPrice(
      currency.mnemonic,
      selectedDate,
    );
    rate = stockPrice.value;
    currency = stockPrice.currency;
  }
  if (currency.guid !== to.guid) {
    rate *= prices.getPrice(
      currency.mnemonic,
      to.mnemonic,
      selectedDate,
    ).value;
  }

  return amount.convert(to.mnemonic, rate);
}
