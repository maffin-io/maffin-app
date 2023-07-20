import React from 'react';
import Selector from '@/components/selectors/Selector';
import { SingleValue } from 'react-select';

import { Account } from '@/book/entities';

export type AccountTypeSelectorProps = {
  placeholder?: string,
  ignoreTypes?: string[],
  defaultValue?: { type: string },
  id?: string,
  isClearable?: boolean,
  className?: string,
  onChange?: Function,
  disabled?: boolean,
};

export default function AccountTypeSelector(
  {
    placeholder,
    ignoreTypes = [],
    defaultValue,
    id = 'typeSelector',
    isClearable = true,
    className = '',
    onChange = () => {},
    disabled = false,
  }: AccountTypeSelectorProps,
): JSX.Element {
  const types = Account.TYPES.slice(1).filter(
    type => !ignoreTypes.includes(type),
  ).map(type => ({ type }));

  return (
    <Selector<{ type: string }>
      id={id}
      labelAttribute="type"
      options={types}
      onChange={(newValue: SingleValue<{ type: string }> | null) => {
        if (onChange) {
          onChange(newValue?.type);
        }
      }}
      placeholder={placeholder || 'Choose account type'}
      isClearable={isClearable}
      defaultValue={defaultValue}
      className={className}
      disabled={disabled}
    />
  );
}
