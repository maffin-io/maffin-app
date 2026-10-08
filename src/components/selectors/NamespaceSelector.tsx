import React from 'react';
import { Props as SelectProps, GroupBase, SingleValue } from 'react-select';

import Selector from '@/components/selectors/Selector';

type Namespace = {
  namespace: string;
};

const NAMESPACES: Namespace[] = [
  { namespace: 'CURRENCY' },
  { namespace: 'STOCK' },
  { namespace: 'FUND' },
  { namespace: 'OTHER' },
];

export default function AccountTypeSelector(
  {
    placeholder = 'Choose namespace',
    id = 'namespaceSelector',
    ...props
  }: SelectProps<Namespace, false, GroupBase<Namespace>>,
): React.JSX.Element {
  return (
    <Selector<Namespace>
      {...props}
      id={id}
      getOptionLabel={(option: Namespace) => option.namespace}
      getOptionValue={(option: Namespace) => option.namespace}
      onChange={(newValue: SingleValue<Namespace> | null) => {
        if (newValue && props.onChange) {
          // @ts-ignore this is hacky as we are mixing onChange functions
          // but I don't want to duplicate onChange listeners
          props.onChange(newValue?.namespace, undefined);
        }
      }}
      options={NAMESPACES}
      placeholder={placeholder}
    />
  );
}
