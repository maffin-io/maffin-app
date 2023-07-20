import React from 'react';
import useSWRImmutable from 'swr/immutable';

import Selector from '@/components/selectors/Selector';
import { Account } from '@/book/entities';
import { getAccountsWithPath } from '@/book/queries';

export type AccountSelectorProps = {
  placeholder?: string,
  ignoreAccounts?: string[],
  defaultValue?: Account,
  id?: string,
  showRoot?: boolean,
  isClearable?: boolean,
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
    className = '',
    onChange = () => {},
  }: AccountSelectorProps,
): JSX.Element {
  let { data: accounts } = useSWRImmutable(
    '/api/accounts',
    getAccountsWithPath,
  );

  accounts = accounts || [];
  accounts = accounts.filter(account => !(ignoreAccounts).includes(account.type));
  if (!showRoot) {
    accounts = accounts.filter(account => account.type !== 'ROOT');
  }

  return (
    <Selector<Account>
      id={id}
      labelAttribute="path"
      options={accounts}
      onChange={onChange}
      placeholder={placeholder || 'Choose account'}
      isClearable={isClearable}
      defaultValue={defaultValue}
      className={className}
    />
  );
}
