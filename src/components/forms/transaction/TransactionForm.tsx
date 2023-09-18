import React from 'react';
import { DateTime } from 'luxon';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { mutate } from 'swr';
import { IsNull } from 'typeorm';
import { Tooltip } from 'react-tooltip';

import {
  Split,
  Transaction,
} from '@/book/entities';
import { isInvestment } from '@/book/helpers/accountType';
import SplitsField from './SplitsField';
import type { FormValues } from './types';

const resolver = classValidatorResolver(Transaction, { validator: { stopAtFirstError: true } });

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
    resolver,
  });

  const { errors } = form.formState;

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

      <fieldset className="text-sm my-5">
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
      </fieldset>

      <fieldset className="text-sm my-5">
        <label className="inline-block mb-2">Splits</label>
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

      <div className="flex w-full gap-2 items-center justify-center">
        <button className={submitButtonClass} type="submit" disabled={Object.keys(errors).length > 0}>
          {submitButtonText}
        </button>
      </div>
    </form>
  );
}

async function onSubmit(data: FormValues, action: 'add' | 'update' | 'delete', onSave: Function) {
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

  mutate('/api/txs/latest');
  onSave();
}
