import React from 'react';
import { useFieldArray } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import classNames from 'classnames';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa6';

import { Split } from '@/book/entities';
import type { FormValues } from './types';
import SplitField from './SplitField';

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
      && splits[0].account
      && splits[0].account?.commodity?.guid === splits[1].account?.commodity?.guid
    ) {
      form.setValue('splits.1.quantity', -mainSplit.value);
      form.setValue('splits.1.value', -mainSplit.value);
      form.trigger('splits');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splits.length, mainSplit.value]);

  return (
    <>
      {
        fields.map((item, index) => (
          <fieldset className="grid grid-cols-12" key={item.id}>
            {
              index === 1
              && (
                <div className="col-span-12 py-3 text-lg font-thin justify-self-center">
                  <div
                    className={classNames('p-2 rounded-full', {
                      'bg-green-500/20 text-green-300': mainSplit.quantity >= 0,
                      'bg-red-500/20 text-red-300': mainSplit.quantity < 0,
                    })}
                  >
                    {
                      (
                        !mainSplit.quantity
                        || mainSplit.quantity <= 0
                      ) ? <FaArrowDown /> : <FaArrowUp />
                    }
                  </div>
                </div>
              )
            }
            <div className="col-span-11">
              <SplitField
                index={index}
                form={form}
                disabled={disabled}
              />
            </div>
            {(
              index !== 0
              && index !== 1
              && (
                <div className="col-span-1">
                  <button
                    type="button"
                    className="btn-primary rounded-sm"
                    onClick={() => remove(index)}
                  >
                    X
                  </button>
                </div>
              )
            )}
          </fieldset>
        ))
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
