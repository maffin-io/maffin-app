import React from 'react';
import { DateTime } from 'luxon';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { mutate } from 'swr';
import { IsNull } from 'typeorm';
import { Tooltip } from 'react-tooltip';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import { isInvestment } from '@/book/helpers/accountType';
import Stocker from '@/apis/Stocker';
import { currencyToSymbol } from '@/helpers/currency';
import SplitsField from './SplitsField';
import type { FormValues } from './types';

// const resolver = classValidatorResolver(Transaction, { validator: { stopAtFirstError: true } });

export type TransactionFormProps = {
  action?: 'add' | 'update' | 'delete',
  onSave: Function,
  defaultValues?: FormValues,
};

export default function TransactionForm({
  action = 'add',
  onSave,
  defaultValues,
}: TransactionFormProps): JSX.Element {
  const form = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
    // resolver,
  });

  const { errors } = form.formState;
  const mainSplit = form.watch('splits.0') as Split;

  let disabled = false;
  let submitButtonText = 'Save';
  let submitButtonClass = 'btn-primary';
  if (action === 'update') {
    submitButtonText = 'Update';
    submitButtonClass = 'btn-warn';
  }
  if (action === 'delete') {
    disabled = true;
    submitButtonText = 'Delete';
    submitButtonClass = 'btn-danger';
  }

  return (
    <form onSubmit={form.handleSubmit((data) => onSubmit(data, action, onSave))}>
      <fieldset className="text-sm my-5">
        <label htmlFor="dateInput" className="inline-block mb-2">Date</label>
        <input
          id="dateInput"
          disabled={disabled}
          className="block w-full m-0"
          {...form.register('date')}
          type="date"
        />
        <p className="invalid-feedback">{errors.date?.message}</p>
      </fieldset>

      <fieldset className="grid grid-cols-12 text-sm my-5">
        <div className="col-span-9 mr-1">
          <label htmlFor="descriptionInput" className="inline-block mb-2">Description</label>
          <span
            className="badge"
            data-tooltip-id="description-help"
          >
            ?
          </span>
          <Tooltip
            id="description-help"
            className="bg-cyan-600 w-1/3 text-white rounded-lg p-2"
            disableStyleInjection
          >
            <p className="mb-2">
              Add a meaningful description to your transaction. The description is shown in the
              list of transactions in the account detail page.
            </p>
            <p>
              It helps to set the same description
              for similar transactions. For example, for a Groceries transaction, you can set
              &quot;Supermarket&quot; to all of them.
            </p>
          </Tooltip>
          <input
            id="descriptionInput"
            disabled={disabled}
            className="block w-full m-0"
            {...form.register('description')}
            type="text"
            placeholder="Enter description"
          />
          <p className="invalid-feedback">{errors.description?.message}</p>
        </div>

        <div className="col-span-3">
          <label htmlFor="quantityInput" className="inline-block mb-2">Amount</label>
          <span
            className="badge"
            data-tooltip-id="quantity-help"
          >
            ?
          </span>
          <Tooltip
            id="quantity-help"
            className="bg-cyan-600 w-1/3 text-white rounded-lg p-2"
            disableStyleInjection
          >
            The total amount of the transaction in the account&apos;s currency
          </Tooltip>
          <div className="flex items-center rounded-md bg-gunmetal-800">
            <input
              {...form.register(
                'splits.0.quantity',
                {
                  valueAsNumber: true,
                },
              )}
              aria-label="splits.0.quantity"
              className="block w-full text-right m-0"
              type="number"
              step="0.001"
              onChange={(e) => {
                const q = e.target.value;
                // Need the ignore to allow users to enter - symbol
                // @ts-ignore
                form.setValue('splits.0.value', q);
              }}
            />
            <span className="pr-2">
              {currencyToSymbol(mainSplit.account?.commodity?.mnemonic || '').slice(0, 3)}
            </span>
          </div>
        </div>
      </fieldset>

      <fieldset className="text-sm my-5">
        <label className="inline-block mb-2">Records</label>
        <span
          className="badge"
          data-tooltip-id="splits-help"
        >
          ?
        </span>
        <Tooltip
          id="splits-help"
          className="bg-cyan-600 w-1/3 text-white rounded-lg p-2"
          disableStyleInjection
        >
          <p className="mb-2">
            Records of the transaction. Usually you only need one entry for
            simple transactions like &quot;I spent 100 in groceries&quot;.
          </p>
          <p>
            In some cases, you may want to split your transaction into
            multiple entries like 50% spent in food account and 50% spent
            in alcohol account. That&apos;s when having multiple records comes in
            handy.
          </p>
        </Tooltip>
        <SplitsField
          disabled={disabled}
          form={form}
        />
      </fieldset>

      <input
        {...form.register(
          'guid',
        )}
        hidden
        type="text"
      />

      <input
        {...form.register(
          'fk_currency',
        )}
        hidden
        type="number"
      />

      <div
        hidden={false}
      >
        Exchange rates
        <span
          className="badge"
          data-tooltip-id="exchange-help"
        >
          ?
        </span>
        <Tooltip
          id="exchange-help"
          className="bg-cyan-600 w-1/3 text-white rounded-lg p-2"
          disableStyleInjection
        >
          <p className="mb-2">
            Your accounts in the transaction have different currencies so
            we need to convert the amounts for proper tracking.
          </p>
          <p>
            The rates are retrieved automatically on the date you&apos;ve
            entered but can be edited if needed.
          </p>
        </Tooltip>
      </div>

      <div className="flex w-full gap-2 items-center justify-center">
        <button className={submitButtonClass} type="submit" disabled={Object.keys(errors).length > 0}>
          {submitButtonText}
        </button>
      </div>
    </form>
  );
}

async function onSubmit(data: FormValues, action: 'add' | 'update' | 'delete', onSave: Function) {
  data.splits[0].value = data.splits.slice(1).reduce(
    (total, split) => total + split.value,
    0,
  ) * -1;
  const transaction = Transaction.create({
    ...data,
    guid: data.guid || undefined,
    date: DateTime.fromISO(data.date),
  });

  if (action === 'add') {
    await transaction.save();
  } else if (action === 'update') {
    await transaction.save();
    await Split.delete({
      fk_transaction: IsNull(),
    });
  } else if (action === 'delete') {
    // Not using cascade here because seems it has problems with
    // old data. Deleting splits manually for now
    await Split.remove(transaction.splits);
    await transaction.remove();
  }

  transaction.splits.forEach(split => {
    if (isInvestment(split.account)) {
      mutate('/api/investments');
    }
    mutate(`/api/splits/${split.account.guid}`);
  });

  mutate((key: string) => key.startsWith('/api/monthly-totals'));
  mutate('/api/txs/latest');
  onSave();
}
