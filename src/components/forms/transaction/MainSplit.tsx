import React from 'react';
import { DateTime } from 'luxon';
import classNames from 'classnames';
import type { UseFormReturn } from 'react-hook-form';
import { BiRightArrowAlt } from 'react-icons/bi';
import Link from 'next/link';

import { Tooltip } from '@/components/tooltips';
import { Price } from '@/book/entities';
import { toFixed } from '@/helpers/number';
import { currencyToSymbol } from '@/helpers/currency';
import { usePrices } from '@/hooks/api';
import type { Account } from '@/book/entities';
import type { FormValues } from './types';

export type MainSplitProps = {
  form: UseFormReturn<FormValues>,
  disabled?: boolean,
};

export default function MainSplit({
  form,
  disabled = false,
}: MainSplitProps): React.JSX.Element {
  const account = form.getValues('splits.0.fk_account') as Account;
  const date = form.watch('date');
  const txCurrency = form.watch('fk_currency');
  const quantity = form.watch('splits.0.quantity');
  const splits = form.watch('splits');

  const { data: prices } = usePrices({ from: account?.commodity });
  const [exchangeRate, setExchangeRate] = React.useState(
    Price.create({ valueNum: 1, valueDenom: 1, fk_currency: txCurrency }),
  );

  React.useEffect(() => {
    if (
      form.formState.isDirty
      && date
      && prices
    ) {
      let rate = null;
      const d = DateTime.fromISO(date);
      if (account.commodity.guid !== txCurrency.guid && txCurrency.namespace === 'CURRENCY') {
        rate = account.commodity.namespace !== 'CURRENCY'
          ? prices.getInvestmentPrice(account.commodity.mnemonic, d)
          : prices.getPrice(account.commodity.mnemonic, txCurrency.mnemonic, d);

        setExchangeRate(rate);
      } else {
        setExchangeRate(Price.create({ valueNum: 1, valueDenom: 1 }));
      }
    }
  }, [txCurrency, date, form.formState.isDirty, account, prices]);

  React.useEffect(() => {
    if (form.formState.isDirty && splits.length > 1) {
      form.setValue('splits.0.value', toFixed(quantity * exchangeRate.value, 6));
      form.trigger('splits');
    }
  }, [quantity, exchangeRate, splits.length, form]);

  return (
    <div className="flex w-1/2">
      <div className="flex items-center rounded-md bg-background-800">
        <input
          {...form.register(
            'splits.0.quantity',
            {
              valueAsNumber: true,
            },
          )}
          aria-label="splits.0.quantity"
          className="w-full text-right m-0"
          type="number"
          step="any"
          disabled={disabled}
        />
        <span className="pr-2">
          {currencyToSymbol(account?.commodity?.mnemonic || '').slice(0, 3)}
        </span>
      </div>

      <div
        className={
          classNames(
            'flex items-center rounded-md',
            {
              hidden: txCurrency.mnemonic === account.commodity.mnemonic,
            },
          )
        }
      >
        <span
          className="badge default mx-3"
          data-tooltip-id="value-help"
        >
          <BiRightArrowAlt />
        </span>
        <Tooltip
          id="value-help"
          clickable
        >
          <p className="mb-2">
            Your account commodity is
            {' '}
            {account.commodity.mnemonic}
            {' '}
            but we are storing the transaction in
            {' '}
            {txCurrency.mnemonic}
            {' '}
            so we&apos;ve converted the amount using the data you have in your
            {' '}
            <Link
              href="/dashboard/commodities"
            >
              Commodities config
            </Link>
          </p>
        </Tooltip>

        <div
          className={
            classNames(
              'flex items-center rounded-md  bg-background-800',
              {
                'outline outline-red-500/50': form.formState.errors.splits?.type === 'splitsBalance',
              },
            )
          }
        >
          <input
            {...form.register(
              'splits.0.value',
              {
                valueAsNumber: true,
              },
            )}
            aria-label="splits.0.value"
            className="w-full text-right m-0"
            type="number"
            step="any"
            disabled={disabled}
            hidden={txCurrency.mnemonic === account.commodity.mnemonic}
            onChange={(e) => {
              form.setValue('splits.0.value', Number(e.target.value));
              form.trigger('splits');
            }}
          />
          <span className="pr-2">
            {currencyToSymbol(txCurrency.mnemonic || '').slice(0, 3)}
          </span>
        </div>
      </div>
    </div>
  );
}
