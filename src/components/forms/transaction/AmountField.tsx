import React from 'react';
import classNames from 'classnames';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

import Money from '@/book/Money';
import type { Account } from '@/book/entities';
import type { SplitFieldData } from './types';

export type AmountFieldProps = {
  fromAccount: Account,
  splits: SplitFieldData[],
};

export default function AmountField(
  { fromAccount, splits }: AmountFieldProps,
): JSX.Element {
  let money = new Money(0, fromAccount.commodity.mnemonic);
  if (
    splits.length === 0
    || splits.find(split => !split.toAccount || split.toAccount.guid === '')
  ) {
    return (
      <span className="block py-2 px-4 rounded-lg bg-gunmetal-800 text-sm">
        {money.format()}
      </span>
    );
  }

  splits.forEach((split) => {
    money = money.add(new Money(split.amount || 0, fromAccount.commodity.mnemonic));
  });
  // Total split is always the negative of the partial splits
  money = money.multiply(-1);

  return (
    <span
      className={classNames(
        'flex gap-1 items-center py-2 px-4 rounded-lg bg-gunmetal-800 text-sm',
        {
          'bg-green-500/20 text-green-300': money.toNumber() > 0,
          'bg-red-500/20 text-red-300': money.toNumber() < 0,
        },
      )}
    >
      {money.toNumber() > 0 && <FaArrowUp />}
      {money.toNumber() < 0 && <FaArrowDown />}
      {money.format()}
    </span>
  );
}
