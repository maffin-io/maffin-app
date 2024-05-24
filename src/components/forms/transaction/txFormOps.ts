import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { FormValues } from './types';

export type TransactionFormContext = {
  action?: 'add' | 'update' | 'delete',
  splitsFieldArray: UseFieldArrayReturn<FormValues, 'splits', 'id'>,
  form: UseFormReturn<FormValues>,
  disabled?: boolean,
};

const hasMainSplitField = (formContext: TransactionFormContext) => (
  formContext.action === 'add' || formContext.action === 'delete'
);

const hasSplitFieldsOtherThanMain = (formContext: TransactionFormContext) => (
  hasMainSplitField(formContext)
    ? formContext.splitsFieldArray.fields.length > 1
    : formContext.splitsFieldArray.fields.length > 0
);

const getMainSplitValue = ({ form }: TransactionFormContext) => form.getValues('splits.0');

const getSplitsErrorMessage = ({ form }: TransactionFormContext) => (
  form.formState.errors.splits?.message
);

export const txFormOps = {
  getMainSplitValue,
  getSplitsErrorMessage,
  hasMainSplitField,
  hasSplitFieldsOtherThanMain,
};
