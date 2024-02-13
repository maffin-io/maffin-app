import React from 'react';
import { Props as SelectProps, GroupBase } from 'react-select';

import Selector from '@/components/selectors/Selector';
import { useAccounts } from '@/hooks/api';
import { Account } from '@/book/entities';

export interface AccountSelectorProps extends SelectProps<Account, false, GroupBase<Account>> {
  ignoreAccounts?: string[],
  ignorePlaceholders?: boolean,
  ignoreHidden?: boolean,
  showRoot?: boolean,
}

export default function AccountSelector(
  {
    ignoreAccounts = [],
    ignorePlaceholders = true,
    ignoreHidden = true,
    showRoot = false,
    id = 'accountSelector',
    placeholder = 'Choose account',
    ...props
  }: AccountSelectorProps,
): JSX.Element {
  const { data: accounts } = useAccounts();

  let options = accounts || [];

  options = options.filter(account => account && !(ignoreAccounts).includes(account.type));
  if (!showRoot) {
    options = options.filter(account => account.type !== 'ROOT');
  }

  if (ignorePlaceholders) {
    options = options.filter(account => !account.placeholder);
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
      options={options}
      placeholder={placeholder || 'Choose account'}
    />
  );
}
