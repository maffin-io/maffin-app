import React from 'react';
import { DateTime } from 'luxon';
import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { isAsset, isInvestment } from '@/book/helpers/accountType';
import { getMainCurrency } from '@/lib/queries';
import Stocker from '@/apis/Stocker';
import { AccountSelector } from '@/components/selectors';
import { currencyToSymbol } from '@/helpers/currency';
import { toFixed } from '@/helpers/number';
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
  const splits = form.watch('splits');
  const mainSplit = splits[0];
  const account = form.watch(`splits.${index}.fk_account`) as Account;
  const date = form.watch('date');
  const txCurrency = form.watch('fk_currency');

  return (
    <fieldset className="grid grid-cols-12" key={`splits.${index}`}>
      <div className="col-span-9">
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
                  console.log('haha');
                  field.onChange(newValue);
                  const mainCurrency = await getMainCurrency();
                  let newTxCurrency: Commodity = txCurrency;

                  splits.forEach(split => {
                    if (split.account && split.account.commodity.guid === mainCurrency.guid) {
                      newTxCurrency = mainCurrency;
                    }
                  });

                  if (newValue.commodity !== txCurrency) {
                    const rate = await getExchangeRate(
                      newValue,
                      mainSplit.account.commodity,
                      DateTime.fromISO(date),
                    );
                    form.setValue(`splits.${index}.quantity`, toFixed(mainSplit.quantity / (-rate)));
                  }

                  form.setValue('fk_currency', newTxCurrency);
                  form.trigger('splits');
                }}
                defaultValue={account}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </div>

      <div className="col-span-3">
        <div className="flex items-center rounded-md bg-gunmetal-800">
          <input
            {...form.register(
              `splits.${index}.quantity`,
              {
                valueAsNumber: true,
              },
            )}
            aria-label={`splits.${index}.quantity`}
            className="block w-full text-right m-0"
            type="number"
            step="0.001"
          />
          <span className="pr-2">
            {currencyToSymbol(account?.commodity?.mnemonic || '').slice(0, 3)}
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
  let ticker = `${account.commodity.mnemonic}${to.mnemonic}=X`;

  if (isInvestment(account)) {
    ticker = account.commodity.mnemonic;
  }

  const rate = await new Stocker().getPrice(ticker, when);
  // TODO: We should check somewhere that the txCurrency is the same
  // as the stocks' currency to avoid price discrepancies.
  return rate.price;
}
