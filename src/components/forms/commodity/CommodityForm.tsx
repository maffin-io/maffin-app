import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { mutate } from 'swr';
import classNames from 'classnames';

import {
  Commodity,
} from '@/book/entities';
import { NamespaceSelector } from '@/components/selectors';

const resolver = classValidatorResolver(Commodity, { validator: { stopAtFirstError: true } });

export type CommodityFormProps = {
  action?: 'add' | 'update' | 'delete',
  onSave: Function,
  defaultValues?: Partial<Commodity>,
};

export default function CommodityForm({
  action = 'add',
  defaultValues,
  onSave,
}: CommodityFormProps): JSX.Element {
  const form = useForm<Commodity>({
    defaultValues,
    mode: 'onChange',
    resolver,
  });

  const { errors } = form.formState;
  const disabled = action === 'delete';

  return (
    <form onSubmit={form.handleSubmit((data) => onSubmit(data, action, onSave))}>
      <div className="grid grid-cols-12 text-sm my-5 gap-2">
        <fieldset className="col-span-6">
          <label htmlFor="mnemonicInput" className="inline-block text-sm my-2">Code</label>
          <input
            id="mnemonicInput"
            disabled={disabled}
            className="w-full m-0"
            {...form.register('mnemonic')}
            type="text"
          />
          <p className="invalid-feedback">{errors.mnemonic?.message}</p>
        </fieldset>

        <fieldset className="col-span-6">
          <label htmlFor="fullNameInput" className="inline-block text-sm my-2">Name</label>
          <input
            id="fullNameInput"
            disabled={disabled}
            className="w-full m-0"
            {...form.register('fullname')}
            type="text"
          />
          <p className="invalid-feedback">{errors.fullname?.message}</p>
        </fieldset>
      </div>

      <fieldset className="col-start-8 col-span-2">
        <label htmlFor="namespaceInput" className="inline-block mb-2">Type</label>
        <Controller
          control={form.control}
          name="namespace"
          render={({ field, fieldState }) => (
            <>
              <NamespaceSelector
                id="namespaceInput"
                isDisabled={disabled}
                isClearable={false}
                placeholder="<commodity type>"
                onChange={field.onChange}
                defaultValue={
                  (defaultValues?.namespace && { namespace: defaultValues.namespace }) || undefined
                }
              />
              <p className="invalid-feedback">{fieldState.error?.message}</p>
            </>
          )}
        />
      </fieldset>

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
  data: Commodity,
  action: 'add' | 'update' | 'delete',
  onSave: Function,
) {
  const commodity = Commodity.create({
    ...data,
    guid: data.guid || undefined,
  });

  if (action === 'add') {
    await commodity.save();
    mutate('/api/commodities');
  } else if (action === 'update') {
    await commodity.save();
    mutate(`/api/commodities/${data.guid}`);
  }

  onSave(commodity);
}
