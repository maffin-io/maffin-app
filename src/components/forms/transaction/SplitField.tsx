import React from 'react';
import { Controller } from 'react-hook-form';
import type {
  Control,
  UseFormRegister,
  UseFieldArrayRemove,
  FieldErrors,
} from 'react-hook-form';

import AccountSelector from '@/components/AccountSelector';
import { currencyToSymbol } from '@/helpers/currency';
import type { Account } from '@/book/entities';
import type { FormValues, SplitFieldData } from './types';

export type SplitFieldProps = {
  id: string,
  split: SplitFieldData,
  fromAccount: Account,
  index: number,
  control: Control<FormValues>,
  remove: UseFieldArrayRemove,
  register: UseFormRegister<FormValues>,
  errors: FieldErrors<FormValues>,
};

export default function SplitField({
  id,
  split,
  fromAccount,
  index,
  control,
  remove,
  register,
  errors,
}: SplitFieldProps): JSX.Element {
  const fromAccountCurrency = fromAccount.commodity.mnemonic;
  const splitCurrency = split.toAccount?.commodity.mnemonic;

  let showCurrencyExchange = false;
  if (splitCurrency && fromAccountCurrency !== splitCurrency) {
    showCurrencyExchange = true;
  }

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
