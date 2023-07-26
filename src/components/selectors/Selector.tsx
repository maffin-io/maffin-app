import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import Select, { SingleValue, components } from 'react-select';
import { BiSearch } from 'react-icons/bi';

export type SelectorProps<T> = {
  labelAttribute: string,
  options: T[],
  id?: string,
  placeholder?: string,
  onChange?: Function,
  isClearable?: boolean,
  defaultValue?: T,
  className?: string,
  disabled?: boolean,
};

export default function Selector<T extends object = {}>(
  {
    labelAttribute,
    options,
    placeholder,
    onChange,
    defaultValue,
    id = 'selector',
    isClearable = true,
    className = '',
    disabled = false,
  }: SelectorProps<T>,
): JSX.Element {
  const ref = React.useRef<HTMLDivElement>();
  useHotkeys('meta+k', () => {
    ref.current?.focus();
  });

  return (
    <Select
      // @ts-ignore
      ref={ref}
      id={id}
      name={id}
      aria-label={id}
      options={options}
      placeholder={placeholder || 'Choose an option'}
      onChange={(newValue: SingleValue<T> | null) => {
        if (onChange) {
          onChange(newValue);
        }
        ref.current?.blur();
      }}
      isClearable={isClearable}
      isDisabled={disabled}
      defaultValue={defaultValue}
      backspaceRemovesValue
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          ref.current?.blur();
        }
      }}
      // @ts-ignore dunno how to set proper types here
      getOptionLabel={(option: T) => option[labelAttribute]}
      // @ts-ignore dunno how to set proper types here
      getOptionValue={(option: T) => option[labelAttribute]}
      openMenuOnFocus
      components={{ Control }}
      className={className}
      styles={{
        option: () => ({}),
      }}
      classNames={{
        // We set h-9 so it's the same as other inputs
        control: (state) => {
          const styles = '!h-9 !min-h-fit text-sm pl-10 !bg-gunmetal-800 !border-none';
          if (state.isDisabled) {
            // For some reason putting focus:bg-gunmetal-700 doesnt work
            return `opacity-50 ${styles}`;
          }
          return styles;
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
      <BiSearch className="absolute text-md left-[10px]" />
      {children}
    </components.Control>
  );
}
