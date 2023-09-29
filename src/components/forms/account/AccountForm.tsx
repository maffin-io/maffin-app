import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { DateTime } from 'luxon';
import { mutate } from 'swr';

import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';
import {
  AccountSelector,
  CommoditySelector,
  AccountTypeSelector,
} from '@/components/selectors';
import { getAllowedSubAccounts } from '@/book/helpers/accountType';
import { toAmountWithScale } from '@/helpers/number';
import type { AccountsMap } from '@/types/book';
import createEquityAccount from '@/lib/createEquityAccount';
import { Tooltip } from 'react-tooltip';

const resolver = classValidatorResolver(Account, { validator: { stopAtFirstError: true } });

export type AccountFormProps = {
  onSave: Function,
};

export type FormValues = {
  name: string,
  parent: Account,
  fk_commodity: Commodity,
  type: string,
  balance?: number,
  balanceDate?: string,
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

      <fieldset
        className={`grid grid-cols-12 text-sm my-5 ${type === 'BANK' ? 'visible' : 'hidden'}`}
      >
        <div
          className="col-span-6"
        >
          <label htmlFor="balanceInput" className="inline-block mb-2">Opening balance</label>
          <span
            className="badge"
            data-tooltip-id="balance-help"
          >
            ?
          </span>
          <Tooltip
            id="balance-help"
            className="bg-cyan-600 w-1/3 text-white rounded-lg p-2"
            disableStyleInjection
          >
            <p>
              The initial amount you have in the account for the date
              you want to start tracking your finances.
            </p>
          </Tooltip>
          <input
            id="balanceInput"
            className="block w-full h-[38px] m-0 rounded-r-none"
            {...form.register('balance')}
            type="number"
          />
          <p className="invalid-feedback">{errors.balance?.message}</p>
        </div>
        <div
          className="col-span-6"
        >
          <label htmlFor="dateInput" className="inline-block mb-2">When</label>
          <span
            className="badge"
            data-tooltip-id="date-help"
          >
            ?
          </span>
          <Tooltip
            id="date-help"
            className="bg-cyan-600 w-1/3 text-white rounded-lg p-2"
            disableStyleInjection
          >
            <p>
              The date for the opening balance you&apos;ve selected.
            </p>
          </Tooltip>
          <input
            id="dateInput"
            className="block w-full m-0 rounded-l-none"
            {...form.register('balanceDate')}
            type="date"
            defaultValue={DateTime.now().toISODate() as string}
          />
          <p className="invalid-feedback">{errors.balanceDate?.message}</p>
        </div>
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
  const account = await Account.create({ ...data }).save();

  mutate(
    '/api/accounts',
    async (accounts: AccountsMap) => {
      const [child, parent] = await Promise.all([
        Account.findOneByOrFail({ guid: account.guid }),
        Account.findOneByOrFail({ guid: account.parent.guid }),
      ]);
      return {
        ...accounts,
        [child.guid]: child,
        [parent.guid]: parent,
      };
    },
    { revalidate: false },
  );

  if (data.balance) {
    let equityAccount = await Account.findOneBy({
      type: 'EQUITY',
      name: `Opening balances - ${account.commodity.mnemonic}`,
    });

    if (!equityAccount) {
      equityAccount = await createEquityAccount(account.commodity);

      mutate(
        '/api/accounts',
        async (accounts: AccountsMap) => {
          const [equity, equityRoot] = await Promise.all([
            Account.findOneByOrFail({ guid: equityAccount?.guid }),
            Account.findOneByOrFail({ guid: equityAccount?.parent.guid }),
          ]);
          return {
            ...accounts,
            [equity.guid]: equity,
            [equityRoot.guid]: equityRoot,
          };
        },
        { revalidate: false },
      );
    }

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
      date: data.balanceDate ? DateTime.fromISO(data.balanceDate as string) : DateTime.now(),
    }).save();

    // Opening balances affect net worth
    mutate('/api/monthly-totals', undefined);
  }
  onSave();
}
