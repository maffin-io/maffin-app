import React from 'react';
import { Props as SelectProps, GroupBase } from 'react-select';
import classNames from 'classnames';

import Selector from '@/components/selectors/Selector';
import { useAccounts } from '@/hooks/api';
import { Account } from '@/book/entities';
import { isAsset, isLiability } from '@/book/helpers/accountType';
import { accountColorCode } from '@/helpers/classNames';

export interface AccountSelectorProps extends SelectProps<Account, false, GroupBase<Account>> {
  ignoreAccounts?: string[],
  ignorePlaceholders?: boolean,
  onlyPlaceholders?: boolean,
  ignoreHidden?: boolean,
  showRoot?: boolean,
}

export default function AccountSelector(
  {
    ignoreAccounts = [],
    ignorePlaceholders = false,
    onlyPlaceholders = false,
    ignoreHidden = true,
    showRoot = false,
    id = 'accountSelector',
    placeholder = 'Choose account',
    ...props
  }: AccountSelectorProps,
): JSX.Element {
  const { data: accounts } = useAccounts();

  let options = accounts || [];

  options = options.filter(account => account && !(ignoreAccounts).includes(account.guid));
  if (!showRoot) {
    options = options.filter(account => account.type !== 'ROOT');
  }

  if (ignorePlaceholders) {
    options = options.filter(account => !account.placeholder);
  } else if (onlyPlaceholders) {
    options = options.filter(account => account.placeholder);
  }

  if (ignoreHidden) {
    options = options.filter(account => !account.hidden);
  }

  return (
    <Selector<Account>
      {...props}
      id={id}
      getOptionLabel={(option: Account) => option.path}
      getOptionValue={(option: Account) => option.path}
      options={options.sort((a, b) => a.path.localeCompare(b.path))}
      placeholder={placeholder || 'Choose account'}
      defaultValue={accounts?.find(a => a.guid === (props.defaultValue as Account)?.guid)}
      classNames={{
        option: (option) => {
          if (option.isFocused || option.isSelected) {
            return accountColorCode(option.data, 'bg-opacity-70 text-white');
          }

          return classNames('', {
            'text-green-600': option.data.type === 'INCOME',
            'text-red-600/80': option.data.type === 'EXPENSE',
            'text-violet-600': ['INVESTMENT'].includes(option.data.type),
            'text-cyan-600': isAsset(option.data),
            'text-orange-600': isLiability(option.data),
            'text-cyan-700': option.data.type === 'EQUITY',
          });
        },
      }}
    />
  );
}
