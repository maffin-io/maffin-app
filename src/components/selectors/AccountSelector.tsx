import React from 'react';

import Selector from '@/components/selectors/Selector';
import { useAccounts } from '@/hooks/api';
import { Account } from '@/book/entities';

export type AccountSelectorProps = {
  placeholder?: string,
  ignoreAccounts?: string[],
  ignorePlaceholders?: boolean,
  ignoreHidden?: boolean,
  defaultValue?: Account,
  id?: string,
  showRoot?: boolean,
  isClearable?: boolean,
  disabled?: boolean,
  className?: string,
  onChange?: Function,
};

export default function AccountSelector(
  {
    placeholder,
    ignoreAccounts = [],
    ignorePlaceholders = true,
    ignoreHidden = true,
    defaultValue,
    id = 'accountSelector',
    showRoot = false,
    isClearable = true,
    disabled = false,
    className = '',
    onChange = () => {},
  }: AccountSelectorProps,
): JSX.Element {
  let { data: accounts } = useAccounts();

  accounts = accounts || {};
  let options: Account[] = [];

  // Filter out duplicates that can be accessed via `type_`
  Object.entries(accounts).forEach(([key, account]) => {
    if (!key.startsWith('type_')) {
      options.push(account);
    }
  });

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
      id={id}
      labelAttribute="path"
      options={options}
      onChange={onChange}
      placeholder={placeholder || 'Choose account'}
      isClearable={isClearable}
      disabled={disabled}
      defaultValue={defaultValue}
      className={className}
    />
  );
}
