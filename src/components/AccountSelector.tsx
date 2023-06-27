import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import Select, {
  SingleValue,
  components,
} from 'react-select';
import { BiSearch } from 'react-icons/bi';

import { getAccountsWithPath } from '@/book/queries';
import { Account } from '@/book/entities';
import { useDataSource } from '@/hooks';

export type AccountSelectorProps = {
  id?: string,
  placeholder?: string,
  onChange?: Function,
  ignoreAccounts?: string[],
  className?: string,
};

export default function AccountSelector(
  {
    placeholder,
    onChange,
    ignoreAccounts,
    id = 'accountSelector',
    className = '',
  }: AccountSelectorProps,
): JSX.Element {
  const ref = React.useRef<HTMLDivElement>();
  useHotkeys('meta+k', () => {
    ref.current?.focus();
  });
  const [datasource] = useDataSource();
  const [accounts, setAccounts] = React.useState<Account[]>([]);

  React.useEffect(() => {
    async function load() {
      if (datasource) {
        setAccounts(await getAccountsWithPath());
      }
    }

    load();
  }, [datasource]);

  return (
    <Select
      // @ts-ignore
      ref={ref}
      id={id}
      name={id}
      aria-label={id}
      options={accounts.filter(account => !(ignoreAccounts || []).includes(account.type))}
      placeholder={placeholder || 'Choose account'}
      onChange={(newValue: SingleValue<Account> | null) => {
        if (onChange) {
          onChange(newValue);
        }
      }}
      isClearable
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
