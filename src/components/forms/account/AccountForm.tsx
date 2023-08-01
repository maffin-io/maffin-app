import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { mutate } from 'swr';

import { Account, Commodity } from '@/book/entities';
import {
  AccountSelector,
  CommoditySelector,
  AccountTypeSelector,
} from '@/components/selectors';
import { getAllowedSubAccounts } from '@/book/helpers/accountType';

const resolver = classValidatorResolver(Account, { validator: { stopAtFirstError: true } });

export type AccountFormProps = {
  onSave: Function,
};

export type FormValues = {
  name: string,
  parent: Account,
  fk_commodity: Commodity,
  type: string,
};

export type SplitFieldData = {
  amount: number,
  toAccount: Account,
  exchangeRate?: number,
};

export default function AccountForm({ onSave }: AccountFormProps): JSX.Element {
  const form = useForm<FormValues>({
    mode: 'onChange',
    resolver,
  });
  const { errors } = form.formState;

  const parent = form.watch('parent');
  const ignoreTypes = (
    parent
    && Account.TYPES.filter(type => !getAllowedSubAccounts(parent.type).includes(type))
  ) || [];

  return (
    <form onSubmit={form.handleSubmit((data) => onSubmit(data, onSave))}>
      <fieldset className="text-sm my-5">
        <label htmlFor="nameInput" className="inline-block mb-2">Name</label>
        <input
          id="nameInput"
          className="block w-full m-0"
          {...form.register('name')}
          type="text"
        />
        <p className="invalid-feedback">{errors.name?.message}</p>
      </fieldset>

      <fieldset className="text-sm my-5">
        <label htmlFor="parent" className="inline-block mb-2">Parent</label>
        <Controller
          control={form.control}
          name="parent"
          render={({ field, fieldState }) => (
            <>
              <AccountSelector
                id="parentInput"
                showRoot
                isClearable={false}
                ignoreAccounts={['STOCK', 'MUTUAL']}
                placeholder="<parent account>"
                onChange={field.onChange}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

      <fieldset className="text-sm my-5">
        <label htmlFor="type" className="inline-block mb-2">Account type</label>
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <>
              <AccountTypeSelector
                id="typeInput"
                placeholder={parent ? '<select account type>' : '<select parent first>'}
                disabled={!parent}
                ignoreTypes={ignoreTypes}
                onChange={field.onChange}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

      <fieldset className="text-sm my-5">
        <label htmlFor="commodity" className="inline-block mb-2">Commodity</label>
        <Controller
          control={form.control}
          name="fk_commodity"
          render={({ field, fieldState }) => (
            <>
              <CommoditySelector
                id="commodityInput"
                placeholder="<commodity>"
                onChange={field.onChange}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

      <div className="flex w-full justify-center">
        <button className="btn-primary" type="submit" disabled={!form.formState.isValid}>
          Save
        </button>
      </div>
    </form>
  );
}

async function onSubmit(data: FormValues, onSave: Function) {
  await Account.create({ ...data }).save();
  mutate((key: string) => key.startsWith('/api/accounts'));
  onSave();
}
