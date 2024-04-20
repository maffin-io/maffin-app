import { Split } from '@/book/entities';
import { TransactionFormContext } from './txFormOps';

const onAddSplit = ({ splitsFieldArray }: TransactionFormContext) => {
  const newSplit = Split.create({ value: 0, quantity: 0 });
  return splitsFieldArray.append(newSplit);
};

export const txFormActions = {
  onAddSplit,
};
