import React from 'react';
import { useFieldArray } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { Tooltip } from '@/components/tooltips';
import { splitOps } from '@/book/entities/splitOps';
import type { FormValues } from './types';
import MainSplit from './MainSplit';
import { TransactionFormContext, txFormOps } from './txFormOps';
import { SplitRow, prepareSplitRowProps } from './SplitRow';
import { txFormActions } from './txFormActions';

function isTruthy<T = unknown>(value: T | null | undefined): value is T {
  return !!value;
}

const prepareSplitRows = (formContext: TransactionFormContext) => {
  const { splitsFieldArray } = formContext;
  return splitsFieldArray.fields
    .map((_, index) => prepareSplitRowProps(formContext, { index }))
    .filter(isTruthy);
};

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
  const splitsFieldArray = useFieldArray({
    control: form.control,
    name: 'splits',
  });
  const formContext: TransactionFormContext = {
    action, form, disabled, splitsFieldArray,
  };
  const splitRows = prepareSplitRows(formContext);
  const showMainSplit = txFormOps.hasMainSplitField(formContext);
  const errorMessage = txFormOps.getSplitsErrorMessage(formContext);

  const handleAddSplit = () => txFormActions.onAddSplit(formContext);

  const splits = form.watch('splits');
  const [mainSplit] = splits;

  React.useEffect(() => {
    if (action !== 'add') {
      return;
    }

    // If the user changes the main split value and we only have two splits,
    // then we want to update the second split to be the opposite of the main split.
    if (splits.length === 2) {
      if (splitOps.isSameCommodity(splits[0], splits[1])) {
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
        showMainSplit
        && (
          <div>
            <label className="inline-block mb-2">Amount</label>
            <MainSplit form={form} disabled={disabled} />
          </div>
        )
      }
      {
        splitRows.length > 0
        && (
          <>
            <label className="inline-block mt-5 mb-2">Records</label>
            {splitRows.map((splitRowProps) => <SplitRow {...splitRowProps} />)}
          </>
        )
      }
      <p className="invalid-feedback">{errorMessage}</p>
      {!disabled && (<AddSplitButton onClick={handleAddSplit} />)}
    </>
  );
}

type AddSplitButtonProps = {
  onClick: () => void,
};

function AddSplitButton(props: AddSplitButtonProps) {
  return (
    <>
      <button
        className="link m-3 mr-0"
        type="button"
        onClick={props.onClick}
      >
        Add split
      </button>
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
    </>
  );
}
