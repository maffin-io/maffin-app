import { DateTime } from 'luxon';
import React from 'react';
import { validate } from 'class-validator';
import { useForm, useFieldArray } from 'react-hook-form';

import {
  Account,
  Split,
  Transaction,
  Commodity,
  Price,
} from '@/book/entities';
import { toAmountWithScale } from '@/helpers/number';
import { getMainCurrency } from '@/book/queries';
import SplitField from './SplitField';
import AmountField from './AmountField';
import type { FormValues } from './types';

export type TransactionFormProps = {
  onSave: Function,
  account: Account,
};

export default function TransactionForm({ onSave, account }: TransactionFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm<FormValues>({
    defaultValues: {
      splits: [defaultSplit],
      fromAccount: account,
    },
    mode: 'onChange',
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'splits',
  });
  const watchSplits = watch('splits');

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, onSave))}>
      <fieldset className="text-sm my-5">
        <label htmlFor="dateInput" className="inline-block mb-2">Date</label>
        <input
          id="dateInput"
          className="block w-full m-0"
          {...register('date', { required: 'Date is required' })}
          type="date"
        />
        <p className="invalid-feedback">{errors.date?.message}</p>
      </fieldset>

      <fieldset className="text-sm my-5">
        <label htmlFor="descriptionInput" className="inline-block mb-2">Description</label>
        <input
          id="descriptionInput"
          className="block w-full m-0"
          {...register('description', { required: 'Description is required' })}
          type="text"
          placeholder="Enter description"
        />
        <p className="invalid-feedback">{errors.description?.message}</p>
      </fieldset>

      <fieldset className="text-sm my-5">
        <label className="inline-block mb-2">Entries</label>
        {fields.map((item, index) => (
          <SplitField
            key={item.id}
            id={item.id}
            split={watchSplits[index]}
            fromAccount={account}
            index={index}
            control={control}
            register={register}
            remove={remove}
            errors={errors}
          />
        ))}
        <button
          className="link m-3"
          type="button"
          onClick={() => append(defaultSplit)}
        >
          Add split
        </button>
      </fieldset>

      <div className="flex w-full gap-2 items-center justify-center">
        <AmountField
          fromAccount={account}
          splits={watchSplits}
        />
        <button className="btn-primary" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}

/**
 * Creates a transaction with the associated splits. There are some special cases:
 *
 *  - If the currency from the source account is different from the other account,
 *    we set the proper amounts accordingly based on the mandatory exchange rate
 *    showed to the user.
 *
 *  - If the currency of the transaction is different from the mainCurrency (hardcoded
 *    for now), we store a price object containing the exchange rate so we can
 *    calculate the reports/investments
 *
 *  - What happens when from/to currencies are not in our mainCurrency? I think this
 *    explodes
 *      Thought? Should we force users to have their expenses/income always in main
 *      currency? this simplifies reporting but adds a limitation... I think I need
 *      to work on reporting to have more visibility on this to see if it's an
 *      actual problem or not :/
 *
 *      let's make a simple histogram in the account page to show this. The currency
 *      for this histogram will be the currency of the account you are displaying.
 *      Should we accumulate the children transactions? Yes I think it makes sense...
 *      Maybe show a widget displaying the children accounts so it's less confusing
 *
 *      This makes me think though.. should we show children transactions in the
 *      transactions table? It will increase loading times for root accounts
 *      the fact we disable adding transactions to expenses/income accounts is
 *      a good thing as users will select asset account for adding/deducting money
 *      which reduces confusion if we do this. We should add a column for showing
 *      to which children path the transaction belongs to though. Also... how
 *      do you calculate totals when there are mixed currencies there? ...
 */
async function onSubmit(data: FormValues, onSave: Function) {
  const { fromAccount } = data;

  const transaction = await Transaction.create({
    guid: crypto.randomUUID().substring(0, 31),
    fk_currency: fromAccount.commodity,
    date: DateTime.fromISO(data.date),
    description: data.description,
  });

  // THIS IS WRONG, main currency can be different for others
  const mainCurrency = await getMainCurrency();
  const splits: Split[] = [];
  let splitsTotal = 0;
  data.splits.forEach(splitData => {
    const { toAccount } = splitData;
    const { amount, scale } = toAmountWithScale(splitData.amount);
    const { amount: exAmount, scale: exScale } = toAmountWithScale(
      splitData.amount * (splitData.exchangeRate || 1),
    );

    const split = Split.create({
      guid: crypto.randomUUID().substring(0, 31),
      fk_account: toAccount.guid,
      fk_transaction: transaction,
      valueNum: amount,
      valueDenom: parseInt('1'.padEnd(scale + 1, '0'), 10),
      quantityNum: exAmount,
      quantityDenom: parseInt('1'.padEnd(exScale + 1, '0'), 10),
    });
    splits.push(split);
    splitsTotal -= splitData.amount;

    if (fromAccount.commodity.guid !== mainCurrency.guid) {
      const { amount: rateAmount, scale: rateScale } = toAmountWithScale(
        splitData.exchangeRate || 1,
      );
      // THIS IS WRONG, will probably explode at some point as mainCurrency is not EUR always
      Price.upsert(
        {
          guid: crypto.randomUUID().substring(0, 31),
          fk_commodity: fromAccount.commodity,
          fk_currency: mainCurrency.guid,
          date: DateTime.fromISO(data.date),
          valueNum: toAccount.commodity.mnemonic === 'EUR' ? rateAmount : 1,
          valueDenom: toAccount.commodity.mnemonic === 'EUR' ? parseInt(
            '1'.padEnd(rateScale + 1, '0'),
            10,
          ) : 1,
        },
        {
          conflictPaths: ['fk_commodity', 'fk_currency', 'date'],
        },
      );
    }
  });

  const { amount, scale } = toAmountWithScale(splitsTotal);
  const quantityNum = amount;
  const quantityDenom = parseInt('1'.padEnd(scale + 1, '0'), 10);
  const split = Split.create({
    guid: crypto.randomUUID().substring(0, 31),
    fk_account: fromAccount.guid,
    fk_transaction: transaction,
    valueNum: quantityNum,
    valueDenom: quantityDenom,
    quantityNum,
    quantityDenom,
  });
  splits.push(split);

  const validationErrors = await validate(transaction);
  if (validationErrors.length > 0) {
    throw new Error(`Transaction is invalid ${validationErrors}`);
  }

  await Transaction.save(transaction);
  await Split.insert(splits);
  onSave();
}

const defaultSplit = {
  amount: 0.0,
  toAccount: {
    guid: '',
    path: '',
    type: '',
    commodity: {
      mnemonic: '',
    } as Commodity,
  } as Account,
};
