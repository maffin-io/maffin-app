import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import Select, {
  components,
  Props as SelectProps,
  SelectInstance,
  GroupBase,
} from 'react-select';
import AsyncCreatableSelect, { AsyncCreatableProps } from 'react-select/async-creatable';
import { BiSearch } from 'react-icons/bi';

type SelectorProps<T> = {
  creatable?: boolean;
} & (SelectProps<T, false, GroupBase<T>> | AsyncCreatableProps<T, false, GroupBase<T>>);

export default function Selector<T extends object = {}>(
  {
    creatable = false,
    placeholder,
    onChange,
    className = '',
    isClearable = true,
    id = 'selector',
    ...props
  }: SelectorProps<T>,
): JSX.Element {
  const ref = React.useRef<SelectInstance<T, false, GroupBase<T>>>();
  useHotkeys('meta+k', () => {
    ref.current?.focus();
  });

  const Component = creatable ? AsyncCreatableSelect : Select;

  return (
    <Component
      {...props}
      ref={ref as React.Ref<SelectInstance<T, false, GroupBase<T>>>}
      id={id}
      name={id}
      aria-label={id}
      options={props.options}
      placeholder={placeholder || 'Choose an option'}
      backspaceRemovesValue
      onChange={(...args) => {
        if (onChange) {
          onChange(...args);
        }
        ref.current?.blur();
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          ref.current?.blur();
        }
      }}
      isClearable={isClearable}
      openMenuOnFocus
      components={{ Control }}
      className={`selector ${className}`}
      classNamePrefix="selector"
      styles={{
        option: () => ({}),
      }}
      classNames={{
        indicatorSeparator: () => 'hidden',
        singleValue: () => '!text-inherit',
        input: () => '!text-inherit',
        option: () => {
          const backgroundClasses = 'bg-light-100 dark:bg-dark-800 hover:bg-white/60 dark:hover:bg-dark-700';
          return `w-full cursor-default px-4 py-2 ${backgroundClasses}`;
        },
        ...props.classNames,
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
