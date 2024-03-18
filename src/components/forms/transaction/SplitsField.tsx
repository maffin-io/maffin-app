import React from 'react';
import { useFieldArray } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { Tooltip } from '@/components/tooltips';
import { Split } from '@/book/entities';
import type { FormValues } from './types';
import SplitField from './SplitField';
import MainSplit from './MainSplit';

export type SplitsFieldProps = {
  action?: 'add' | 'update' | 'delete',
  form: UseFormReturn<FormValues>,
  disabled?: boolean,
};

export default function SplitsField({
  action = 'add',
  form,
  disabled = false,
}: SplitsFieldProps): JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'splits',
  });

  const splits = form.watch('splits');
  const mainSplit = splits[0];
  let firstSplitIndex = 1;
  if (action === 'update') {
    firstSplitIndex = 0;
  }

  React.useEffect(() => {
    if (
      splits.length === 2
      && action === 'add'
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
      {
        action !== 'update'
        && (
          <div>
            <label className="inline-block mb-2">Amount</label>
            <MainSplit form={form} disabled={disabled} />
          </div>
        )
      }
      <label className="inline-block mt-5 mb-2">Records</label>
      {
        fields.slice(firstSplitIndex).map((item, index) => {
          index += firstSplitIndex;
          return (
            <fieldset className="grid grid-cols-12" key={item.id}>
              <div className="col-span-11">
                <SplitField
                  action={action}
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
            <span
              className="badge default ml-0.5"
              data-tooltip-id="add-split-help"
            >
              ?
            </span>
            <Tooltip
              id="add-split-help"
            >
              <p className="mb-2">
                Adding extra splits to a transaction is helpful when you want to split
                a transaction between different categories.
              </p>
              <p>
                An example would be a transaction where you deduct 100 euros from your
                Asset account and send 70 to Groceries and 30 to Restaurant.
              </p>
            </Tooltip>
          </button>
        )
      }
    </>
  );
}
