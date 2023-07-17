import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import Select, {
  SingleValue,
  components,
} from 'react-select';
import { BiSearch } from 'react-icons/bi';
import useSWRImmutable from 'swr/immutable';

import { Account } from '@/book/entities';
import { getAccountsWithPath } from '@/book/queries';

export type AccountSelectorProps = {
  id?: string,
  placeholder?: string,
  onChange?: Function,
  showRoot?: boolean,
  isClearable?: boolean,
  ignoreAccounts?: string[],
  defaultValue?: Account,
  className?: string,
};

export default function AccountSelector(
  {
    placeholder,
    onChange,
    ignoreAccounts,
    id = 'accountSelector',
    showRoot = false,
    isClearable = true,
    defaultValue,
    className = '',
  }: AccountSelectorProps,
): JSX.Element {
  const ref = React.useRef<HTMLDivElement>();
  useHotkeys('meta+k', () => {
    ref.current?.focus();
  });

  let { data: accounts } = useSWRImmutable(
    '/api/accounts',
    getAccountsWithPath,
  );

  accounts = accounts || [];
  accounts = accounts.filter(account => !(ignoreAccounts || []).includes(account.type));
  if (!showRoot) {
    accounts = accounts.filter(account => account.type !== 'ROOT');
  }

  return (
    <Select
      // @ts-ignore
      ref={ref}
      id={id}
      name={id}
      aria-label={id}
      options={accounts}
      placeholder={placeholder || 'Choose account'}
      onChange={(newValue: SingleValue<Account> | null) => {
        if (onChange) {
          onChange(newValue);
        }
      }}
      isClearable={isClearable}
      defaultValue={defaultValue}
      backspaceRemovesValue
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          ref.current?.blur();
        }
      }}
      getOptionLabel={(option) => option.path}
      getOptionValue={(option) => option.path}
      openMenuOnFocus
      components={{ Control }}
      className={className}
      styles={{
        option: () => ({}),
      }}
      classNames={{
        // We set h-9 so it's the same as other inputs
        control: () => '!h-9 !min-h-fit text-sm pl-10 !bg-gunmetal-800 !border-none',
        indicatorSeparator: () => 'hidden',
        menu: () => 'text-sm !bg-gunmetal-800',
        option: (state) => {
          const styles = 'w-full cursor-default hover:bg-gunmetal-700 px-4 py-2';
          if (state.isFocused) {
            // For some reason putting focus:bg-gunmetal-700 doesnt work
            return `bg-gunmetal-700 ${styles}`;
          }
          return styles;
        },
        singleValue: () => '!text-inherit',
        input: () => '!text-inherit',
      }}
    />
  );
}

function Control(
  {
    children,
    ...props
  }: any,
): JSX.Element {
  return (
    <components.Control {...props}>
      <BiSearch className="absolute text-md left-[10px]" />
      {children}
    </components.Control>
  );
}
