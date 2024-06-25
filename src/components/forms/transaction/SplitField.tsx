import React from 'react';
import { DateTime } from 'luxon';
import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import classNames from 'classnames';
import type { SingleValue } from 'react-select';

import { getMainCurrency } from '@/lib/queries';
import { toFixed } from '@/helpers/number';
import { AccountSelector } from '@/components/selectors';
import { currencyToSymbol } from '@/helpers/currency';
import { usePrices } from '@/hooks/api';
import { Account, Price } from '@/book/entities';
import { getAllowedSubAccounts } from '@/book/helpers/accountType';
import type { FormValues } from './types';

export type SplitFieldProps = {
  index: number;
  form: UseFormReturn<FormValues>,
  disabled?: boolean,
  action?: 'add' | 'update' | 'delete',
};

export default function SplitField({
  index,
  form,
  action = 'add',
  disabled = false,
}: SplitFieldProps): JSX.Element {
  const account = form.watch(`splits.${index}.fk_account`) as Account;
  const txCurrency = form.watch('fk_currency');
  const date = form.watch('date');
  const { data: prices } = usePrices({ from: account?.commodity });
  const [exchangeRate, setExchangeRate] = React.useState(
    Price.create({ valueNum: 1, valueDenom: 1, fk_currency: txCurrency }),
  );

  const showValueField = account?.commodity && account.commodity.guid !== txCurrency?.guid;
  const value = form.watch(`splits.${index}.value`);

  React.useEffect(() => {
    if (
      account
      && date
      && action === 'add'
      && prices
    ) {
      let rate = null;
      const d = DateTime.fromISO(date);
      if (showValueField && txCurrency.namespace === 'CURRENCY') {
        rate = account.commodity.namespace !== 'CURRENCY'
          ? prices.getInvestmentPrice(account.commodity.mnemonic, d)
          : prices.getPrice(account.commodity.mnemonic, txCurrency.mnemonic, d);

        setExchangeRate(rate);
      } else {
        setExchangeRate(Price.create({ valueNum: 1, valueDenom: 1 }));
      }
    }
  }, [account, showValueField, txCurrency, date, action, prices]);

  React.useEffect(() => {
    if (value && action === 'add') {
      form.setValue(
        `splits.${index}.quantity`,
        toFixed(value / exchangeRate.value, 6),
      );
    }
    form.trigger('splits');
  }, [value, exchangeRate, form, action, index]);

  const defaultAccount = form.formState.defaultValues?.splits?.[index]?.fk_account as Account;

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
                isDisabled={disabled}
                placeholder={defaultAccount?.type ? `<Choose a ${defaultAccount.type} account>` : '<Choose an account>'}
                ignorePlaceholders
                onlyTypes={
                  defaultAccount?.type ? getAllowedSubAccounts(defaultAccount.type) : undefined
                }
                onChange={async (a: SingleValue<Account>) => {
                  field.onChange(a);
                  const mainCurrency = await getMainCurrency();
                  const splits = form.getValues('splits');

                  if (a) {
                    const investmentSplit = splits.find(
                      split => (split.fk_account as Account).type === 'INVESTMENT',
                    );

                    if (investmentSplit) {
                      const investmentAccount = investmentSplit.fk_account as Account;
                      let currency = investmentAccount.commodity;

                      if (investmentAccount.commodity.namespace !== 'CURRENCY') {
                        ({ currency } = await Price.findOneByOrFail({
                          fk_commodity: {
                            guid: investmentAccount.commodity.guid,
                          },
                        }));
                      }
                      form.setValue('fk_currency', currency);
                    } else if (txCurrency.guid !== mainCurrency.guid) {
                      if (a.commodity.guid === mainCurrency?.guid) {
                        form.setValue('fk_currency', mainCurrency);
                      } else {
                        form.setValue('fk_currency', (splits[0].fk_account as Account).commodity);
                      }
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
        <div
          className={
            classNames(
              'flex items-center rounded-none bg-background-800',
              {
                'rounded-r-md': !showValueField,
              },
            )
          }
        >
          <input
            {...form.register(
              `splits.${index}.quantity`,
              {
                valueAsNumber: true,
              },
            )}
            aria-label={`splits.${index}.quantity`}
            className="w-full text-right m-0"
            type="number"
            step="any"
            disabled={disabled}
            onChange={(e) => {
              const splits = form.getValues('splits');
              if (!showValueField && splits.length > 1) {
                const quantity = Number(e.target.value);
                form.setValue(`splits.${index}.value`, quantity * exchangeRate.value);
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
        <div className="flex items-center rounded-r-md bg-background-800">
          <input
            {...form.register(
              `splits.${index}.value`,
              {
                valueAsNumber: true,
              },
            )}
            aria-label={`splits.${index}.value`}
            className="w-full text-right m-0"
            type="number"
            step="any"
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
