import { DateTime } from 'luxon';
import { toAmountWithScale } from '@/helpers/number';
import Stocker from '@/apis/Stocker';

import {
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import { getMainCurrency } from '@/book/queries';
import { isInvestment, isAsset } from '@/book/helpers';

export async function createTransaction(
  when: DateTime,
  description: string,
  mainSplit: Split,
  splits: Split[],
): Promise<void> {
  const { currency, rate } = getTransactionCurrency(mainSplit, splits);

  const transaction = Transaction.create({
    guid: crypto.randomUUID().substring(0, 31),
    fk_currency: currency,
    date: when,
    description,
  });

  splits.forEach(split => {
    split.fk_transaction = transaction;

    // If we've exchanged currency to avoid having STOCK currency
    // as currency transaction, correct value and quantity
    if (split.account.commodity.guid === currency.guid) {
      split.valueNum = split.quantityNum;
      split.valueDenom = split.quantityDenom;
    }
  });

  // eslint-disable-next-line no-param-reassign
  mainSplit.fk_transaction = transaction;

  // We recalculate value for mainSplit in case we've swapped currencies
  const { amount, scale } = toAmountWithScale(mainSplit.value * rate);
  mainSplit.valueNum = amount;
  mainSplit.valueDenom = parseInt('1'.padEnd(scale + 1, '0'), 10);

  const mainCurrency = await getMainCurrency();
  if (currency.guid !== mainCurrency.guid && isInvestment(mainSplit.account)) {
    const mainCurrencyRate = await new Stocker().getPrice(
      `${currency.mnemonic}${mainCurrency.mnemonic}=X`,
      when,
    );
    const { amount: rateAmount, scale: rateScale } = toAmountWithScale(mainCurrencyRate.price);
    Price.upsert(
      {
        guid: crypto.randomUUID().substring(0, 31),
        fk_commodity: currency,
        fk_currency: mainCurrency.guid,
        date: when,
        valueNum: rateAmount,
        valueDenom: parseInt('1'.padEnd(rateScale + 1, '0'), 10),
      },
      {
        conflictPaths: ['fk_commodity', 'fk_currency', 'date'],
      },
    );
  }

  await transaction.save();
  await Split.insert([mainSplit, ...splits]);
}

/**
 * This function decides the currency of the transaction depending
 * on the account type. Normally, we want it to be the currency of the
 * mainSplit but there are some edge cases:
 *
 * - If the mainSplit account is an investment, we want the currency to be
 *   a fiat currency so we pick the currency of the Asset account related
 *   to the transaction
 */
function getTransactionCurrency(
  mainSplit: Split,
  splits: Split[],
): { currency: Commodity, rate: number } {
  let currency = mainSplit.account.commodity;
  let rate = 1;
  if (isInvestment(mainSplit.account)) {
    splits.forEach(split => {
      if (isAsset(split.account)) {
        currency = split.account.commodity;
        rate = split.quantity / split.value;
      }
    });
  }

  return { currency, rate };
}
