import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { SingleValue } from 'react-select';
import * as currencies from '@dinero.js/currencies';

import { Commodity } from '@/book/entities';
import Selector from '@/components/selectors/Selector';

const resolver = classValidatorResolver(Commodity, { validator: { stopAtFirstError: true } });

const CURRENCIES = Object.keys(currencies).map(c => ({ label: c }));

type CurrencyOption = { [code: string]: string };

export type CurrencyFormProps = {
  onSave: Function,
};

export default function CurrencyForm({ onSave }: CurrencyFormProps): React.JSX.Element {
  const form = useForm<Commodity>({
    mode: 'onChange',
    resolver,
    defaultValues: {
      namespace: 'CURRENCY',
    },
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
              <Selector<CurrencyOption>
                className="min-w-[322px]"
                id="currency-selector"
                isClearable={false}
                getOptionLabel={(option: CurrencyOption) => option.label}
                getOptionValue={(option: CurrencyOption) => option.label}
                onChange={(newValue: SingleValue<CurrencyOption> | null) => {
                  field.onChange(newValue?.label, undefined);
                }}
                options={CURRENCIES}
                placeholder="Choose or type your currency"
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

async function onSubmit(data: Commodity, onSave: Function) {
  const mainCommodity = await Commodity.create({
    ...data,
  }).save();
  await onSave(mainCommodity);
}
