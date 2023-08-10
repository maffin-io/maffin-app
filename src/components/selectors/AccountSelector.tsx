import React from 'react';
import type { SWRResponse } from 'swr';

import Selector from '@/components/selectors/Selector';
import { useApi } from '@/hooks';
import { Account } from '@/book/entities';
import type { AccountsMap } from '@/types/book';

export type AccountSelectorProps = {
  placeholder?: string,
  ignoreAccounts?: string[],
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
    defaultValue,
    id = 'accountSelector',
    showRoot = false,
    isClearable = true,
    disabled = false,
    className = '',
    onChange = () => {},
  }: AccountSelectorProps,
): JSX.Element {
  let { data: accounts } = useApi('/api/accounts') as SWRResponse<AccountsMap>;

  accounts = accounts || {};
  let options = Object.values(accounts);
  options = options.filter(account => !(ignoreAccounts).includes(account.type));
  if (!showRoot) {
    options = options.filter(account => account.type !== 'ROOT');
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
