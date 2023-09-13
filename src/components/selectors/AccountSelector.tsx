import React from 'react';

import Selector from '@/components/selectors/Selector';
import { useAccounts } from '@/hooks/api';
import { Account } from '@/book/entities';

export type AccountSelectorProps = {
  placeholder?: string,
  ignoreAccounts?: string[],
  ignorePlaceholders?: boolean,
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
    ignorePlaceholders = false,
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
  let options = Object.values(accounts);
  options = options.filter(account => !(ignoreAccounts).includes(account.type));
  if (!showRoot) {
    options = options.filter(account => account.type !== 'ROOT');
  }

  if (ignorePlaceholders) {
    options = options.filter(account => !account.placeholder);
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
