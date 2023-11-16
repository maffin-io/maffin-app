import React from 'react';
import { DateTime } from 'luxon';
import classNames from 'classnames';
import type { UseFormReturn } from 'react-hook-form';
import { Tooltip } from 'react-tooltip';
import { BiRightArrowAlt } from 'react-icons/bi';

import { isInvestment } from '@/book/helpers/accountType';
import { getPrice } from '@/apis/Stocker';
import type { Account, Commodity } from '@/book/entities';
import { toFixed } from '@/helpers/number';
import { currencyToSymbol } from '@/helpers/currency';
import type { FormValues } from './types';

export type MainSplitProps = {
  form: UseFormReturn<FormValues>,
  disabled?: boolean,
};

export default function MainSplit({
  form,
  disabled = false,
}: MainSplitProps): JSX.Element {
  const [exchangeRate, setExchangeRate] = React.useState(1);
  const account = form.getValues('splits.0.fk_account') as Account;
  const date = form.watch('date');
  const txCurrency = form.watch('fk_currency');
  const quantity = form.watch('splits.0.quantity');

  React.useEffect(() => {
    async function fetchRate() {
      const rate = await getExchangeRate(
        account,
        txCurrency,
        DateTime.fromISO(date),
      );
      setExchangeRate(rate);
    }

    if (form.formState.isDirty && date) {
      fetchRate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txCurrency, date, form.formState.isDirty]);

  React.useEffect(() => {
    if (form.formState.isDirty) {
      form.setValue('splits.0.value', toFixed(quantity * exchangeRate, 3));
      form.trigger('splits');
    }
  }, [quantity, exchangeRate, form]);

  return (
    <div className="flex w-1/2">
      <div className="flex items-center rounded-md bg-light-100 dark:bg-dark-800">
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
          step="0.001"
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
          className="badge mx-3"
          data-tooltip-id="value-help"
        >
          <BiRightArrowAlt />
        </span>
        <Tooltip
          id="value-help"
          className="tooltip"
          disableStyleInjection
        >
          <p className="mb-2">
            The account is not in your main currency so this is the converted
            total amount for this transaction.
          </p>
        </Tooltip>

        <div
          className={
            classNames(
              'flex items-center rounded-md  bg-light-100 dark:bg-dark-800',
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
            step="0.001"
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

  const rate = await getPrice(ticker, when);
  // TODO: We should check somewhere that the txCurrency is the same
  // as the stocks' currency to avoid price discrepancies.
  return rate.price;
}
