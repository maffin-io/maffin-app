import React from 'react';
import { DateTime } from 'luxon';
import { useForm, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { mutate } from 'swr';
import classNames from 'classnames';

import { Price } from '@/book/entities';
import { CommoditySelector } from '@/components/selectors';
import type { Commodity } from '@/book/entities';
import { FormValues } from './types';

const resolver = classValidatorResolver(Price, { validator: { stopAtFirstError: true } });

export type PriceFormProps = {
  action?: 'add' | 'update' | 'delete',
  onSave?: Function,
  defaultValues?: Partial<FormValues>,
  hideDefaults?: boolean,
};

export default function PriceForm({
  action = 'add',
  defaultValues,
  onSave = () => {},
  hideDefaults = false,
}: PriceFormProps): JSX.Element {
  const form = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
    resolver,
  });

  const { errors } = form.formState;
  const disabled = action === 'delete';

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

      <fieldset
        className={classNames(
          'text-sm my-5',
          {
            hidden: hideDefaults && defaultValues?.fk_commodity,
          },
        )}
      >
        <label htmlFor="commodityInput" className="inline-block mb-2">From</label>
        <Controller
          control={form.control}
          name="fk_commodity"
          render={({ field, fieldState }) => (
            <>
              <CommoditySelector
                id="commodityInput"
                placeholder="Convert from"
                onChange={field.onChange}
                isDisabled={disabled || action !== 'add'}
                defaultValue={defaultValues?.fk_commodity as Commodity}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

      <div className="grid grid-cols-12 text-sm my-5 gap-2">
        <fieldset
          className={classNames(
            'col-span-6',
            {
              hidden: hideDefaults && defaultValues?.fk_currency,
            },
          )}
        >
          <label htmlFor="currencyInput" className="inline-block mb-2">To</label>
          <Controller
            control={form.control}
            name="fk_currency"
            render={({ field, fieldState }) => (
              <>
                <CommoditySelector
                  id="currencyInput"
                  placeholder="Convert to"
                  onChange={field.onChange}
                  namespace="CURRENCY"
                  isDisabled={disabled || action !== 'add'}
                  defaultValue={defaultValues?.fk_currency as Commodity}
                />
                <p className="invalid-feedback">{fieldState.error?.message}</p>
              </>
            )}
          />
        </fieldset>

        <fieldset className="col-span-6">
          <label htmlFor="priceInput" className="inline-block text-sm mb-2">Price</label>
          <input
            id="priceInput"
            disabled={disabled}
            className="w-full m-0"
            {...form.register('value')}
            type="text"
          />
          <p className="invalid-feedback">{errors.value?.message}</p>
        </fieldset>
      </div>

      <div className="flex w-full justify-center mt-5">
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
  onSave: Function,
) {
  const price = Price.create({
    ...data,
    date: DateTime.fromISO(data.date),
    guid: data.guid || undefined,
  });

  if (action === 'add' || action === 'update') {
    await Price.upsert(
      [price],
      {
        conflictPaths: ['fk_commodity', 'fk_currency', 'date'],
      },
    );
  } else if (action === 'delete') {
    await Price.remove(price);
  }
  mutate(`/api/prices/${price.commodity.guid}`);

  onSave(price);
}
