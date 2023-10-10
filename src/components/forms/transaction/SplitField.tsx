import React from 'react';
import { DateTime } from 'luxon';
import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { isInvestment } from '@/book/helpers/accountType';
import { getMainCurrency } from '@/lib/queries';
import Stocker from '@/apis/Stocker';
import { toFixed } from '@/helpers/number';
import { AccountSelector } from '@/components/selectors';
import { currencyToSymbol } from '@/helpers/currency';
import type { Account, Commodity } from '@/book/entities';
import type { FormValues } from './types';

export type SplitFieldProps = {
  index: number;
  form: UseFormReturn<FormValues>,
  disabled?: boolean,
};

export default function SplitField({
  index,
  form,
  disabled = false,
}: SplitFieldProps): JSX.Element {
  const [exchangeRate, setExchangeRate] = React.useState(1);
  const account = form.watch(`splits.${index}.fk_account`) as Account;
  const txCurrency = form.watch('fk_currency');
  const date = form.watch('date');

  const showValueField = account && account.commodity.guid !== txCurrency?.guid;
  const value = form.watch(`splits.${index}.value`);

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchRate() {
      const rate = await getExchangeRate(
        account,
        txCurrency,
        DateTime.fromISO(date),
      );
      if (!isCancelled) {
        setExchangeRate(rate);
      }
    }

    if (
      account
      && date
      && form.formState.isDirty
    ) {
      fetchRate();
    }

    return () => {
      // This is to avoid race conditions for when both txCurrency and account
      // change at the same time. The problem is that sometimes the second
      // request is faster than the first and then the exchange rate
      // is wrongly set. I don't have a better idea on how to fix this for now
      isCancelled = true;
    };
  }, [account, txCurrency, date, disabled, form.formState.isDirty, index]);

  React.useEffect(() => {
    if (value && form.formState.isDirty) {
      form.setValue(
        `splits.${index}.quantity`,
        toFixed(value / exchangeRate, 2),
      );
    }
    form.trigger('splits');
  }, [value, exchangeRate, form, form.formState.isDirty, index]);

  return (
    <fieldset className="grid grid-cols-13" key={`splits.${index}`}>
      <div className={`col-span-${showValueField ? 7 : 9}`}>
        <Controller
          control={form.control}
          name={`splits.${index}.fk_account`}
          render={({ field, fieldState }) => (
            <>
              <AccountSelector
                id={`splits.${index}.account`}
                isClearable={false}
                disabled={disabled}
                placeholder="<account>"
                onChange={async (newValue: Account) => {
                  field.onChange(newValue);
                  const mainCurrency = await getMainCurrency();
                  const splits = form.getValues('splits');

                  if (txCurrency.guid !== mainCurrency.guid) {
                    if (splits.some(
                      split => split.fk_account.commodity.guid === mainCurrency?.guid,
                    )) {
                      form.setValue('fk_currency', mainCurrency);
                    } else if (splits[0].account.commodity.namespace === 'CURRENCY') {
                      form.setValue('fk_currency', splits[0].account.commodity);
                    } else {
                      form.setValue('fk_currency', splits[1].account.commodity);
                    }
                  }

                  form.trigger('splits');
                }}
                defaultValue={account}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </div>

      <div className={`col-span-${showValueField ? 3 : 4}`}>
        <div className="flex items-center rounded-md bg-gunmetal-800">
          <input
            {...form.register(
              `splits.${index}.quantity`,
              {
                valueAsNumber: true,
              },
            )}
            aria-label={`splits.${index}.quantity`}
            className="w-full text-right bg-gunmetal-800 border-none rounded-sm m-0"
            type="number"
            step="0.001"
            disabled={disabled}
            onChange={(e) => {
              if (account.commodity.guid === txCurrency.guid) {
                const quantity = Number(e.target.value);
                form.setValue(`splits.${index}.value`, toFixed(quantity * exchangeRate, 2));
              }
            }}
          />
          <span className="pr-2">
            {currencyToSymbol(account?.commodity?.mnemonic || '').slice(0, 3)}
          </span>
        </div>
      </div>

      <div
        hidden={!showValueField}
        className="col-span-3"
      >
        <div className="flex items-center rounded-md bg-gunmetal-800">
          <input
            {...form.register(
              `splits.${index}.value`,
              {
                valueAsNumber: true,
              },
            )}
            aria-label={`splits.${index}.value`}
            className="w-full text-right bg-gunmetal-800 border-none rounded-sm m-0"
            type="number"
            step="0.001"
            disabled={disabled}
          />
          <span className="pr-2">
            {currencyToSymbol(txCurrency?.mnemonic || '')}
          </span>
        </div>
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
  if (account.commodity.mnemonic === to.mnemonic) {
    return 1;
  }
  let ticker = `${account.commodity.mnemonic}${to.mnemonic}=X`;

  if (isInvestment(account)) {
    ticker = account.commodity.mnemonic;
  }

  if (to.namespace !== 'CURRENCY') {
    ticker = to.mnemonic;
  }

  const rate = await new Stocker().getPrice(ticker, when);

  if (to.namespace !== 'CURRENCY') {
    if (rate.currency !== account.commodity.mnemonic) {
      throw new Error('The commodity of the account doesnt match the currency of the stock');
    }
    rate.price = 1 / rate.price;
  }
  return rate.price;
}
