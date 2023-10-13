import React from 'react';
import { useFieldArray } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { Split } from '@/book/entities';
import type { FormValues } from './types';
import SplitField from './SplitField';
import MainSplit from './MainSplit';

export type SplitsFieldProps = {
  form: UseFormReturn<FormValues>,
  disabled?: boolean,
};

export default function SplitsField({
  form,
  disabled = false,
}: SplitsFieldProps): JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'splits',
  });

  const splits = form.watch('splits');
  const mainSplit = splits[0];

  React.useEffect(() => {
    if (
      splits.length === 2
      && form.formState.isDirty
    ) {
      if (
        splits[0].account?.commodity?.guid === splits[1].account?.commodity?.guid
      ) {
        form.setValue('splits.1.quantity', -mainSplit.quantity);
      }

      form.setValue('splits.1.value', -mainSplit.value, { shouldValidate: true });
      form.trigger('splits');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splits.length, mainSplit.value, form.formState.isDirty]);

  return (
    <>
      <label className="inline-block mb-2">Amount</label>
      <MainSplit form={form} disabled={disabled} />
      <label className="inline-block mt-5 mb-2">Records</label>
      {
        fields.slice(1).map((item, index) => {
          index += 1;
          return (
            <fieldset className="grid grid-cols-12" key={item.id}>
              <div className="col-span-11">
                <SplitField
                  index={index}
                  form={form}
                  disabled={disabled}
                />
              </div>
              {(
                index > 1
                && (
                  <div className="col-span-1">
                    <button
                      type="button"
                      className="btn btn-primary rounded-sm"
                      onClick={() => remove(index)}
                    >
                      X
                    </button>
                  </div>
                )
              )}
            </fieldset>
          );
        })
      }
      <p className="invalid-feedback">{form.formState.errors.splits?.message}</p>
      {
        !disabled
        && (
          <button
            className="link m-3"
            type="button"
            onClick={() => (
              append(Split.create({
                value: 0,
                quantity: 0,
              }))
            )}
          >
            Add split
          </button>
        )
      }
    </>
  );
}
