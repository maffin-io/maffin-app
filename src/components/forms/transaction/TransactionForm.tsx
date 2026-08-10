import React from 'react';
import { DateTime } from 'luxon';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { IsNull } from 'typeorm';
import classNames from 'classnames';

import {
  Split,
  Transaction,
} from '@/book/entities';
import { Tooltip } from '@/components/tooltips';
import Loading from '@/components/Loading';
import { useTransaction } from '@/hooks/api';
import SplitsField from './SplitsField';
import type { FormValues } from './types';

const resolver = classValidatorResolver(Transaction, { validator: { stopAtFirstError: true } });

export type TransactionFormProps =
| {
  action?: 'add',
  guid?: never,
  onSave?: Function,
  defaultValues?: Partial<FormValues>,
}
| {
  action: 'update' | 'delete',
  guid: string,
  onSave?: Function,
  defaultValues?: never,
};

export default function TransactionForm({
  action = 'add',
  onSave = () => {},
  defaultValues,
  guid = '',
}: TransactionFormProps): React.JSX.Element {
  const { data: tx, isLoading } = useTransaction({
    guid,
    enabled: !!guid,
    select: (data: Transaction) => (
      {
        ...data,
        date: data.date.toISODate() as string,
        fk_currency: data.fk_currency,
        // This is hacky but if we pass the Split
        // class to the form, then we have reference errors as when
        // we update the form, it also updates the defaultValues
        // which means formState.isDirty is not triggered properly
        splits: data.splits.map(split => ({
          ...split,
          value: split.value,
          quantity: split.quantity,
          account: split.fk_account,
        } as Split)),
      } as FormValues
    ),
  });

  const form = useForm<FormValues>({
    defaultValues: defaultValues || tx,
    mode: 'onChange',
    resolver,
  });

  const { errors } = form.formState;
  const disabled = action === 'delete';

  if (guid && isLoading) {
    return <Loading />;
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
          max={DateTime.now().toISODate()}
        />
        <p className="invalid-feedback">{errors.date?.message}</p>
      </fieldset>

      <fieldset className="text-sm my-5">
        <label htmlFor="descriptionInput" className="inline-block mb-2">Description</label>
        <span
          className="badge default ml-0.5"
          data-tooltip-id="description-help"
        >
          ?
        </span>
        <Tooltip
          id="description-help"
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
        <SplitsField
          action={action}
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

      <div className="flex w-full justify-center">
        <button
          className={classNames(
            'btn capitalize',
            {
              'btn-primary': action === 'add',
              'btn-danger': action === 'delete',
              'btn-warn': action === 'update',
            },
          )}
          type="submit"
          disabled={Object.keys(errors).length > 0}
        >
          {action}
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

  onSave();
}
