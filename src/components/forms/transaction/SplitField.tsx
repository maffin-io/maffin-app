import React from 'react';
import { DateTime } from 'luxon';
import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import debounce from 'lodash.debounce';

import { isInvestment } from '@/book/helpers/accountType';
import { getMainCurrency } from '@/book/queries';
import Stocker from '@/apis/Stocker';
import { toFixed } from '@/helpers/number';
import { AccountSelector } from '@/components/selectors';
import { currencyToSymbol } from '@/helpers/currency';
import type { Account, Commodity } from '@/book/entities';
import type { FormValues } from './types';

export type SplitFieldProps = {
  index: number;
  form: UseFormReturn<FormValues>,
};

export default function SplitField({
  index,
  form,
}: SplitFieldProps): JSX.Element {
  const splits = form.watch('splits');
  const account = form.watch(`splits.${index}.fk_account`) as Account;
  const date = form.watch('date');
  const txCurrency = form.watch('fk_currency');

  const disableValueInputs = !date || !splits.every(split => !!split.account);
  const showValueField = account && account.commodity.guid !== txCurrency?.guid;

  async function onQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    let rate = 1;
    if (showValueField) {
      rate = await getExchangeRate(
        account,
        txCurrency,
        DateTime.fromISO(date),
      );
    }
    // @ts-ignore
    form.setValue(`splits.${index}.value`, toFixed(q * rate, 2));

    // validate splits as a whole
    form.trigger('splits');
  }

  const debouncedOnQuantityChange = debounce(onQuantityChange, 350);

  return (
    <fieldset className="grid grid-cols-12" key={`splits.${index}`}>
      <div className={`col-span-${showValueField ? 8 : 9}`}>
        <Controller
          control={form.control}
          name={`splits.${index}.fk_account`}
          render={({ field, fieldState }) => (
            <>
              <AccountSelector
                id={`splits.${index}.account`}
                isClearable={false}
                placeholder="<account>"
                onChange={async (newValue: Account) => {
                  field.onChange(newValue);
                  const mainCurrency = await getMainCurrency();
                  let currency: Commodity = splits[0].account.commodity;

                  splits.forEach(split => {
                    if (split.account && split.account.commodity.guid === mainCurrency.guid) {
                      currency = mainCurrency;
                    }
                  });

                  form.setValue('fk_currency', currency);
                  form.trigger('splits');
                }}
                defaultValue={account}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </div>

      <div className={`col-span-${showValueField ? 2 : 3}`}>
        <span
          className="absolute px-1 py-2"
        >
          {currencyToSymbol(account?.commodity?.mnemonic || '')}
        </span>
        <input
          {...form.register(
            `splits.${index}.quantity`,
            {
              valueAsNumber: true,
            },
          )}
          aria-label={`splits.${index}.quantity`}
          disabled={disableValueInputs}
          className="w-full pl-4 text-right bg-gunmetal-800 border-none rounded-sm m-0"
          placeholder="0"
          type="number"
          step="0.001"
          onChange={(e) => {
            const q = e.target.value;
            // Need the ignore to allow users to enter - symbol
            // @ts-ignore
            form.setValue(`splits.${index}.quantity`, q);
            debouncedOnQuantityChange(e);
          }}
        />
      </div>

      <div
        hidden={!showValueField}
        className="col-span-2"
      >
        <span
          className="absolute px-1 py-2"
        >
          {currencyToSymbol(txCurrency?.mnemonic || '')}
        </span>
        <input
          {...form.register(
            `splits.${index}.value`,
            {
              valueAsNumber: true,
            },
          )}
          aria-label={`splits.${index}.value`}
          disabled={disableValueInputs}
          className="w-full pl-4 text-right bg-gunmetal-800 border-none rounded-sm m-0"
          placeholder="0"
          type="number"
          step="0.001"
        />
      </div>
    </fieldset>
  );
}

/**
 * Retrieves the rate to convert the current account commodity
 * to the currency of the transaction.
 *
 * If the account is an investment, we fetch its value at the given
 * date instead.
 */
async function getExchangeRate(
  account: Account,
  to: Commodity,
  when: DateTime,
): Promise<number> {
  let ticker = `${account.commodity.mnemonic}${to.mnemonic}=X`;

  if (isInvestment(account)) {
    ticker = account.commodity.mnemonic;
  }

  const rate = await new Stocker().getPrice(ticker, when);
  // TODO: We should check somewhere that the txCurrency is the same
  // as the stocks' currency to avoid price discrepancies.
  return rate.price;
}
