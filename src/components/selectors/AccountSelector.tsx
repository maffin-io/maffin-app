import React from 'react';
import type { SWRResponse } from 'swr';

import Selector from '@/components/selectors/Selector';
import { useApi } from '@/hooks';
import { Account } from '@/book/entities';

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
  let { data: accounts } = useApi('/api/accounts') as SWRResponse<Account[]>;

  accounts = accounts || [];
  accounts = accounts.filter(account => !(ignoreAccounts).includes(account.type));
  if (!showRoot) {
    accounts = accounts.filter(account => account.type !== 'ROOT');
  }

  // We do this because received account may not have 'path' attribute.
  // This way we ensure it's always there.
  let account: Account | undefined = defaultValue;
  if (defaultValue) {
    account = accounts.find(a => defaultValue.guid === a.guid);
  }

  return (
    <Selector<Account>
      id={id}
      labelAttribute="path"
      options={accounts}
      onChange={onChange}
      placeholder={placeholder || 'Choose account'}
      isClearable={isClearable}
      disabled={disabled}
      defaultValue={account}
      className={className}
    />
  );
}
