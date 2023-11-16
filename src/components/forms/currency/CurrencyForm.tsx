import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { SingleValue } from 'react-select';

import { Commodity } from '@/book/entities';
import { CommoditySelector } from '@/components/selectors';

const resolver = classValidatorResolver(Commodity, { validator: { stopAtFirstError: true } });

export type FormValues = {
  guid: string,
  namespace: string,
  mnemonic: string,
};

export type CurrencyFormProps = {
  onSave: Function,
};

export default function CurrencyForm({ onSave }: CurrencyFormProps): JSX.Element {
  const form = useForm<FormValues>({
    mode: 'onChange',
    resolver,
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit((data) => onSubmit(data, onSave))}>
      <fieldset className="text-sm my-5">
        <Controller
          control={form.control}
          name="mnemonic"
          render={({ field, fieldState }) => (
            <>
              <CommoditySelector
                id="mnemonicInput"
                onChange={(newValue: SingleValue<Commodity> | null) => {
                  if (newValue) {
                    field.onChange(newValue.mnemonic);
                    form.reset(newValue);
                    form.trigger();
                  }
                }}
                placeholder="Choose or search your currency"
                isClearable={false}
                namespace="CURRENCY"
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

      <div className="flex w-full justify-center">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={Object.keys(errors).length > 0}
        >
          Save
        </button>
      </div>
    </form>
  );
}

async function onSubmit(data: FormValues, onSave: Function) {
  const mainCommodity = Commodity.create({ ...data });
  await onSave(mainCommodity);
}
