import React from 'react';
import SplitField, { type SplitFieldProps, prepareSplitFieldProps } from './SplitField';
import { TransactionFormContext, txFormOps } from './txFormOps';

export type SplitRowProps = {
  key: string;
  splitFieldProps: SplitFieldProps;
  deleteButtonProps?:
  | { show: true; onClick: VoidFunction }
  | { show: false };
};

export const prepareSplitRowProps = (
  formContext: TransactionFormContext,
  { index }: { index: number },
): SplitRowProps | null => {
  const showMainSplit = txFormOps.hasMainSplitField(formContext);
  if (showMainSplit && index === 0) {
    return null;
  }

  const { splitsFieldArray } = formContext;
  const currentField = splitsFieldArray.fields[index];

  const hasDeleteButton = index > 1;
  const deleteButtonProps = hasDeleteButton
    ? { show: true, onClick: () => splitsFieldArray.remove(index) }
    : undefined;

  return {
    key: currentField.id,
    deleteButtonProps,
    splitFieldProps: prepareSplitFieldProps(formContext, index),
  };
};

export function SplitRow(props: SplitRowProps) {
  const { deleteButtonProps, splitFieldProps } = props;

  return (
    <fieldset className="grid grid-cols-12">
      <div className="col-span-11">
        <SplitField {...splitFieldProps} />
      </div>
      {(
        deleteButtonProps?.show
        && (
          <div className="col-span-1">
            <DeleteSplitButton {...deleteButtonProps} />
          </div>
        )
      )}
    </fieldset>
  );
}

function DeleteSplitButton(props: {
  onClick: () => void;
}) {
  return (
    <div className="col-span-1">
      <button
        type="button"
        className="btn btn-primary rounded-sm"
        onClick={props.onClick}
      >
        X
      </button>
    </div>
  );
}
