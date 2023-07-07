import React from 'react';
import { DateTime } from 'luxon';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';

import {
  Account,
  Split,
  Transaction,
} from '@/book/entities';
import SplitsField from './SplitsField';
import type { FormValues } from './types';

const resolver = classValidatorResolver(Transaction, { validator: { stopAtFirstError: true } });

export type TransactionFormProps = {
  onSave: Function,
  account: Account,
};

export default function TransactionForm({ onSave, account }: TransactionFormProps): JSX.Element {
  const form = useForm<FormValues>({
    defaultValues: {
      splits: [
        Split.create({
          value: 0,
          quantity: 0,
          fk_account: account,
        }),
        Split.create({
          value: 0,
          quantity: 0,
        }),
      ],
      fk_currency: account.commodity,
    },
    mode: 'onChange',
    resolver,
  });

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit((data) => onSubmit(data, onSave))}>
      <fieldset className="text-sm my-5">
        <label htmlFor="dateInput" className="inline-block mb-2">Date</label>
        <input
          id="dateInput"
          className="block w-full m-0"
          {...form.register('date')}
          type="date"
        />
        <p className="invalid-feedback">{errors.date?.message}</p>
      </fieldset>

      <fieldset className="text-sm my-5">
        <label htmlFor="descriptionInput" className="inline-block mb-2">Description</label>
        <input
          id="descriptionInput"
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
          form={form}
        />
      </fieldset>

      <input
        {...form.register(
          'fk_currency',
        )}
        hidden
        type="number"
      />

      <div className="flex w-full gap-2 items-center justify-center">
        <button className="btn-primary" type="submit" disabled={!form.formState.isValid}>
          Save
        </button>
      </div>
    </form>
  );
}

async function onSubmit(data: FormValues, onSave: Function) {
  await Transaction.create({
    ...data,
    date: DateTime.fromISO(data.date),
  }).save();
  onSave();
}
