import React from 'react';
import { DateTime } from 'luxon';
import { useForm, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { mutate } from 'swr';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import { toAmountWithScale } from '@/helpers/number';
import {
  AccountSelector,
  CommoditySelector,
  AccountTypeSelector,
} from '@/components/selectors';
import { getAllowedSubAccounts } from '@/book/helpers/accountType';
import {AccountsMap} from '@/types/book';

const resolver = classValidatorResolver(Account, { validator: { stopAtFirstError: true } });

export type AccountFormProps = {
  onSave: Function,
  defaultValues?: FormValues,
};

export type FormValues = {
  name: string,
  parent: Account,
  fk_commodity: Commodity,
  type: string,
  balance?: number,
};

export type SplitFieldData = {
  amount: number,
  toAccount: Account,
  exchangeRate?: number,
};

export default function AccountForm({ onSave, defaultValues }: AccountFormProps): JSX.Element {
  const form = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
    resolver,
  });
  const { errors } = form.formState;

  const parent = form.watch('parent');
  const ignoreTypes = (
    parent
    && Account.TYPES.filter(type => !getAllowedSubAccounts(parent.type).includes(type))
  ) || [];
  const type = form.watch('type');

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
                isClearable={false}
                ignoreAccounts={['STOCK', 'MUTUAL']}
                placeholder="<parent account>"
                onChange={field.onChange}
                defaultValue={defaultValues?.parent}
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
                defaultValue={(defaultValues?.type && { type: defaultValues.type }) || undefined}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

      <fieldset
        className={`text-sm my-5 ${type === 'BANK' ? 'visible' : 'hidden'}`}
      >
        <label htmlFor="balanceInput" className="inline-block mb-2">Opening balance</label>
        <input
          id="balanceInput"
          className="block w-full m-0"
          {...form.register('balance')}
          type="number"
        />
        <p className="invalid-feedback">{errors.balance?.message}</p>
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
                defaultValue={defaultValues?.fk_commodity}
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
  const account = await Account.create({ ...data }).save();

  mutate(
    '/api/accounts',
    async (accounts: AccountsMap) => {
      // Reload child and parent relations
      await account.reload();
      await accounts[account.parentId].reload();
      return {
        ...accounts,
        [account.guid]: account,
      };
    },
    { revalidate: false },
  );

  if (data.balance) {
    const equityAccount = await Account.findOneByOrFail({
      type: 'EQUITY',
      name: `Opening balances - ${account.commodity.mnemonic}`,
    });

    const { amount, scale } = toAmountWithScale(data.balance);
    const denom = parseInt('1'.padEnd(scale + 1, '0'), 10);

    await Transaction.create({
      description: 'Opening balance',
      fk_currency: data.fk_commodity,
      splits: [
        Split.create({
          fk_account: account,
          valueNum: amount,
          valueDenom: denom,
          quantityNum: amount,
          quantityDenom: denom,
        }),
        Split.create({
          fk_account: equityAccount,
          valueNum: -amount,
          valueDenom: denom,
          quantityNum: -amount,
          quantityDenom: denom,
        }),
      ],
      date: DateTime.now(),
    }).save();

    // Opening balances affect net worth
    mutate('/api/monthly-totals');
  }

  onSave();
}
