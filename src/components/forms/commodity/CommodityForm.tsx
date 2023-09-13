import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { SingleValue } from 'react-select';
import { mutate } from 'swr';

import { Commodity } from '@/book/entities';
import Selector from '@/components/selectors/Selector';

const resolver = classValidatorResolver(Commodity, { validator: { stopAtFirstError: true } });

export type FormValues = {
  namespace: string,
  mnemonic: string,
};

export type CommodityFormProps = {
  onSave: Function,
};

const BASE_CURRENCIES = [
  { label: 'EUR' },
  { label: 'USD' },
  { label: 'SGD' },
  { label: 'GBP' },
];

export default function CommodityForm({ onSave }: CommodityFormProps): JSX.Element {
  const form = useForm<FormValues>({
    mode: 'onChange',
    resolver,
  });

  return (
    <form onSubmit={form.handleSubmit((data) => onSubmit(data, onSave))}>
      <fieldset className="text-sm my-5">
        <Controller
          control={form.control}
          name="mnemonic"
          render={({ field, fieldState }) => (
            <>
              <Selector<{ label: string }>
                id="mnemonicInput"
                labelAttribute="label"
                options={BASE_CURRENCIES}
                onChange={(newValue: SingleValue<{ label: string }> | null) => {
                  field.onChange(newValue?.label);
                }}
                placeholder="Choose your currency"
                isClearable={false}
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

      <input
        {...form.register(
          'namespace',
        )}
        hidden
        value="CURRENCY"
        type="text"
      />

      <div className="flex w-full justify-center">
        <button className="btn-primary" type="submit" disabled={!form.formState.isValid}>
          Save
        </button>
      </div>
    </form>
  );
}

async function onSubmit(data: FormValues, onSave: Function) {
  const mainCommodity = await Commodity.create({ ...data }).save();
  mutate('/api/main-currency', mainCommodity);
  await onSave();
}
