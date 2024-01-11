import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { DateTime } from 'luxon';
import { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import classNames from 'classnames';

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
import type { FormValues } from '@/components/forms/account/types';

const resolver = classValidatorResolver(Account, { validator: { stopAtFirstError: true } });

export type AccountFormProps = {
  action?: 'add' | 'update' | 'delete',
  onSave?: Function,
  defaultValues?: Partial<FormValues>,
  hideDefaults?: boolean,
};

export type SplitFieldData = {
  amount: number,
  toAccount: Account,
  exchangeRate?: number,
};

export default function AccountForm({
  action = 'add',
  defaultValues,
  onSave = () => {},
  hideDefaults = false,
}: AccountFormProps): JSX.Element {
  const router = useRouter();
  const form = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
    resolver,
  });

  const { errors } = form.formState;
  const disabled = action === 'delete';

  const parent = form.watch('parent');
  const ignoreTypes = (
    parent
    && Account.TYPES.filter(type => !getAllowedSubAccounts(parent.type).includes(type))
  ) || [];
  const type = form.watch('type');

  return (
    <form onSubmit={form.handleSubmit((data) => onSubmit(data, action, router, onSave))}>
      <div className="grid grid-cols-12 text-sm my-5 gap-2">
        <fieldset className="col-span-6">
          <label htmlFor="nameInput" className="inline-block mb-2">Name</label>
          <input
            id="nameInput"
            disabled={disabled}
            className="w-full m-0"
            {...form.register('name')}
            type="text"
          />
          <p className="invalid-feedback">{errors.name?.message}</p>
        </fieldset>

        <fieldset
          className={classNames(
            'col-start-8 col-span-2',
            {
              hidden: action === 'add',
            },
          )}
        >
          <label htmlFor="hiddenInput" className="inline-block mb-2">Hide</label>
          <span
            className="badge ml-0.5"
            data-tooltip-id="hidden-help"
          >
            ?
          </span>
          <Tooltip
            id="hidden-help"
            className="tooltip"
            disableStyleInjection
          >
            <p>
              For accounts that are closed or not used anymore.
            </p>
          </Tooltip>
          <input
            id="hiddenInput"
            disabled={disabled}
            className="block m-0"
            {...form.register('hidden')}
            type="checkbox"
          />
        </fieldset>
      </div>

      <fieldset
        className={classNames(
          'text-sm my-5',
          {
            hidden: hideDefaults && defaultValues?.parent,
          },
        )}
      >
        <label htmlFor="parent" className="inline-block mb-2">Parent</label>
        <Controller
          control={form.control}
          name="parent"
          render={({ field, fieldState }) => (
            <>
              <AccountSelector
                id="parentInput"
                showRoot
                isDisabled={disabled}
                isClearable={false}
                ignoreAccounts={['STOCK', 'MUTUAL']}
                ignorePlaceholders={false}
                placeholder="<parent account>"
                onChange={field.onChange}
                defaultValue={defaultValues?.parent}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

      <fieldset
        className={classNames(
          'text-sm my-5',
          {
            hidden: hideDefaults && defaultValues?.type,
          },
        )}
      >
        <label htmlFor="type" className="inline-block mb-2">Account type</label>
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <>
              <AccountTypeSelector
                id="typeInput"
                placeholder={parent ? '<select account type>' : '<select parent first>'}
                isDisabled={disabled || !parent}
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
        className={classNames(
          'grid grid-cols-12 text-sm my-5',
          {
            hidden: type !== 'BANK' || action !== 'add',
          },
        )}
      >
        <div
          className="col-span-6"
        >
          <label htmlFor="balanceInput" className="inline-block mb-2">Opening balance</label>
          <span
            className="badge ml-0.5"
            data-tooltip-id="balance-help"
          >
            ?
          </span>
          <Tooltip
            id="balance-help"
            className="tooltip"
            disableStyleInjection
          >
            <p>
              The initial amount you have in the account for the date
              you want to start tracking your finances.
            </p>
          </Tooltip>
          <input
            id="balanceInput"
            disabled={disabled}
            className="block w-full h-[38px] m-0 rounded-r-none"
            {...form.register(
              'balance',
              {
                valueAsNumber: true,
              },
            )}
            step="0.001"
            type="number"
          />
          <p className="invalid-feedback">{errors.balance?.message}</p>
        </div>
        <div
          className="col-span-6"
        >
          <label htmlFor="dateInput" className="inline-block mb-2">When</label>
          <span
            className="badge ml-0.5"
            data-tooltip-id="date-help"
          >
            ?
          </span>
          <Tooltip
            id="date-help"
            className="tooltip"
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

      <fieldset
        className={classNames(
          'text-sm my-5',
          {
            hidden: hideDefaults && defaultValues?.fk_commodity,
          },
        )}
      >
        <label htmlFor="commodity" className="inline-block mb-2">Commodity</label>
        <Controller
          control={form.control}
          name="fk_commodity"
          render={({ field, fieldState }) => (
            <>
              <CommoditySelector
                id="commodityInput"
                placeholder="Choose a commodity for the account"
                onChange={field.onChange}
                defaultValue={defaultValues?.fk_commodity as Commodity}
                isDisabled={disabled || action !== 'add'}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

      <input
        {...form.register(
          'guid',
        )}
        hidden
        type="text"
      />

      <div className="flex w-full justify-center">
        <button
          className={classNames(
            'btn capitalize',
            {
              'btn-primary': action === 'add',
              'btn-warn': action === 'update',
              'btn-danger': action === 'delete',
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

async function onSubmit(
  data: FormValues,
  action: 'add' | 'update' | 'delete',
  router: AppRouterInstance,
  onSave: Function,
) {
  // TODO: check if currency exists, if not, calculate the rate
  // against the parent and against main currency
  const account = Account.create({
    ...data,
    guid: data.guid || undefined,
  });
  // For some reason the beforeInsert doesn't work when updating an account.
  // The code is not different from when we add an account and it works there...
  account.setPath();

  if (action === 'add') {
    await account.save();
    mutate(`/api/accounts/${account.guid}`);
    mutate('/api/accounts');
    if (data.balance) {
      await createBalance(data, account);
    }
  } else if (action === 'update') {
    await account.save();
    mutate(`/api/accounts/${account.guid}`);
    mutate('/api/accounts');
  } else if (action === 'delete') {
    await Account.remove(account);
    mutate(`/api/accounts/${account.guid}`);
    mutate('/api/accounts');
    router.replace('/dashboard/accounts');
  }

  onSave(account);
}

async function createBalance(data: FormValues, account: Account) {
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

  const { amount, scale } = toAmountWithScale(data.balance as number);
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

  mutate('/api/monthly-totals', undefined);
  mutate('/api/txs/latest', undefined);
}
