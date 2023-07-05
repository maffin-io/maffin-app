import React from 'react';
import { Controller } from 'react-hook-form';
import type {
  Control,
  UseFormRegister,
  UseFieldArrayRemove,
  UseFormSetValue,
  FieldErrors,
} from 'react-hook-form';
import { DateTime } from 'luxon';

import { isInvestment } from '@/book/helpers/accountType';
import Stocker from '@/apis/Stocker';
import AccountSelector from '@/components/AccountSelector';
import { currencyToSymbol } from '@/helpers/currency';
import type { Account } from '@/book/entities';
import type { FormValues, SplitFieldData } from './types';

export type SplitFieldProps = {
  id: string,
  split: SplitFieldData,
  date: string,
  fromAccount: Account,
  index: number,
  control: Control<FormValues>,
  remove: UseFieldArrayRemove,
  register: UseFormRegister<FormValues>,
  setValue: UseFormSetValue<FormValues>,
  errors: FieldErrors<FormValues>,
};

export default function SplitField({
  id,
  split,
  date,
  fromAccount,
  index,
  control,
  remove,
  setValue,
  register,
  errors,
}: SplitFieldProps): JSX.Element {
  const fromAccountCurrency = fromAccount.commodity.mnemonic;
  const splitCurrency = split.toAccount?.commodity.mnemonic;

  let showCurrencyExchange = false;
  if (splitCurrency && fromAccountCurrency !== splitCurrency) {
    showCurrencyExchange = true;
  }

  React.useEffect(() => {
    async function fetchExchangeRate(when: DateTime) {
      const rate = await getExchangeRate(fromAccount, split.toAccount, when);
      setValue(`splits.${index}.exchangeRate`, rate);
    }

    const when = DateTime.fromISO(date);
    if (showCurrencyExchange && when.isValid) {
      fetchExchangeRate(when);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split.toAccount, showCurrencyExchange, date, fromAccountCurrency, splitCurrency]);

  return (
    <fieldset className="grid grid-cols-12" key={id}>
      <div className={`col-span-${showCurrencyExchange ? 6 : 8}`}>
        <Controller
          control={control}
          name={`splits.${index}.toAccount`}
          rules={{
            required: 'Account is required',
          }}
          render={({ field, fieldState }) => (
            <>
              <AccountSelector
                id={`splits.${index}.toAccount`}
                placeholder="<account>"
                onChange={field.onChange}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </div>

      <div className="col-span-2">
        <input
          {...register(
            `splits.${index}.amount`,
            {
              required: 'Amount is required',
              validate: (v) => {
                if (split.toAccount?.type === 'INCOME') {
                  return v < 0 || 'Income amounts must be negative';
                }

                if (split.toAccount?.type === 'EXPENSE') {
                  return v > 0 || 'Expense amounts must be positive';
                }

                return true;
              },
              valueAsNumber: true,
            },
          )}
          className="w-full text-right bg-gunmetal-800 border-none rounded-sm m-0"
          placeholder="0.0"
          type="number"
          step="0.001"
        />
        <p className="invalid-feedback">{errors.splits?.[index]?.amount?.message}</p>
      </div>

      <div className="col-span-1">
        <input
          disabled
          className="w-full text-center bg-gunmetal-700 border-none rounded-sm m-0"
          value={currencyToSymbol(fromAccountCurrency)}
        />
      </div>

      {/* TODO: Should autopopulate the field with the exchange rate */}
      {(
        showCurrencyExchange
        && (
          <div className="col-span-2">
            <input
              {...register(
                `splits.${index}.exchangeRate`,
                {
                  required: 'Exchange rate is required',
                  min: { value: 0, message: 'Exchange rate must be positive' },
                  valueAsNumber: true,
                },
              )}
              className="w-full text-center bg-gunmetal-800 border-none rounded-sm m-0"
              placeholder={`${currencyToSymbol(fromAccountCurrency)} -> ${currencyToSymbol(splitCurrency)}`}
              type="number"
              step="0.0001"
            />
            <p className="invalid-feedback">{errors.splits?.[index]?.exchangeRate?.message}</p>
          </div>
        )
      )}
      <div className="col-span-1">
        <button
          type="button"
          className="btn-primary rounded-sm"
          onClick={() => remove(index)}
        >
          X
        </button>
      </div>
    </fieldset>
  );
}

/**
 * Given two accounts and a date return the exchange rate for those.
 * There are two special cases where fromAccount or toAccount is an
 * investment account. In these case we retrieve the price of the stock
 * or 1/price respectively.
 *
 * If both accounts are investments (which I cant think of a use case)
 * then returns 0;
 */
async function getExchangeRate(
  fromAccount: Account,
  toAccount: Account,
  when: DateTime,
): Promise<number> {
  if (isInvestment(fromAccount) && !isInvestment(toAccount)) {
    const rate = await new Stocker().getPrice(fromAccount.name, when);
    return rate.price;
  }

  if (isInvestment(toAccount) && !isInvestment(fromAccount)) {
    const rate = await new Stocker().getPrice(toAccount.name, when);
    return Number((1 / rate.price).toFixed(4));
  }

  if (isInvestment(toAccount) && isInvestment(fromAccount)) {
    return 0;
  }

  const ticker = `${fromAccount.commodity.mnemonic}${toAccount.commodity.mnemonic}=X`;
  const rate = await new Stocker().getPrice(ticker, when);
  return rate.price;
}
