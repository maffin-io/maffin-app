import React from 'react';
import Select, {
  SingleValue,
  components,
} from 'react-select';
import { BiShuffle } from 'react-icons/bi';

import { Account } from '@/book/entities';

export type AccountTypeSelectorProps = {
  id?: string,
  placeholder?: string,
  onChange?: Function,
  disabled?: boolean,
  ignoreTypes?: string[],
  className?: string,
};

export default function AccountTypeSelector(
  {
    placeholder,
    onChange,
    ignoreTypes = [],
    id = 'accountSelector',
    disabled = false,
    className = '',
  }: AccountTypeSelectorProps,
): JSX.Element {
  const ref = React.useRef<HTMLDivElement>();
  const types = Account.TYPES.slice(1).filter(
    type => !ignoreTypes.includes(type),
  ).map(type => ({ type }));

  return (
    <Select
      // @ts-ignore
      ref={ref}
      id={id}
      name={id}
      aria-label={id}
      options={types}
      isDisabled={disabled}
      placeholder={placeholder || 'Choose account type'}
      onChange={(newValue: SingleValue<{ type: string }> | null) => {
        if (onChange) {
          onChange(newValue?.type);
        }
      }}
      isClearable
      backspaceRemovesValue
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          ref.current?.blur();
        }
      }}
      getOptionLabel={(option) => option.type}
      getOptionValue={(option) => option.type}
      openMenuOnFocus
      components={{ Control }}
      className={className}
      styles={{
        option: () => ({}),
      }}
      classNames={{
        // We set h-9 so it's the same as other inputs
        control: ({ isDisabled }) => {
          if (isDisabled) {
            return '!h-9 !min-h-fit text-sm pl-10 !bg-gunmetal-700 !border-none';
          }
          return '!h-9 !min-h-fit text-sm pl-10 !bg-gunmetal-800 !border-none';
        },
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
      <BiShuffle className="absolute text-md left-[10px]" />
      {children}
    </components.Control>
  );
}
