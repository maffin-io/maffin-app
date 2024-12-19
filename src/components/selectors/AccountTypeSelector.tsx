import React from 'react';
import { Props as SelectProps, GroupBase, SingleValue } from 'react-select';

import Selector from '@/components/selectors/Selector';
import { Account } from '@/book/entities';

type AccountType = {
  type: string;
};

export interface AccountTypeSelectorProps extends SelectProps<
AccountType,
false,
GroupBase<AccountType>
> {
  ignoreTypes?: string[],
}

export default function AccountTypeSelector(
  {
    ignoreTypes = [],
    placeholder = 'Choose account type',
    id = 'typeSelector',
    ...props
  }: AccountTypeSelectorProps,
): React.JSX.Element {
  const types = Account.TYPES.slice(1).filter(
    type => !ignoreTypes.includes(type),
  ).map(type => ({ type }));

  return (
    <Selector<AccountType>
      {...props}
      id={id}
      getOptionLabel={(option: AccountType) => option.type}
      getOptionValue={(option: AccountType) => option.type}
      onChange={(newValue: SingleValue<AccountType> | null) => {
        if (newValue && props.onChange) {
          // @ts-ignore this is hacky as we are mixing onChange functions
          // but I don't want to duplicate onChange listeners
          props.onChange(newValue?.type, undefined);
        }
      }}
      options={types}
      placeholder={placeholder}
    />
  );
}
