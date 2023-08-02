import React from 'react';
import type { SWRResponse } from 'swr';

import { useApi } from '@/hooks';
import { Commodity } from '@/book/entities';
import Selector from '@/components/selectors/Selector';

export type CommoditySelectorProps = {
  placeholder?: string,
  ignoreNamespaces?: string[],
  defaultValue?: Commodity,
  id?: string,
  isClearable?: boolean,
  className?: string,
  onChange?: Function,
};

export default function CommoditySelector(
  {
    placeholder,
    ignoreNamespaces = [],
    defaultValue,
    id = 'commoditySelector',
    isClearable = true,
    className = '',
    onChange = () => {},
  }: CommoditySelectorProps,
): JSX.Element {
  let { data: commodities } = useApi('/api/commodities') as SWRResponse<Commodity[]>;
  commodities = commodities || [];
  commodities = commodities.filter(
    commodity => !(ignoreNamespaces).includes(commodity.namespace),
  );

  return (
    <Selector<Commodity>
      id={id}
      labelAttribute="mnemonic"
      options={commodities}
      onChange={onChange}
      placeholder={placeholder || 'Choose commodity'}
      isClearable={isClearable}
      defaultValue={defaultValue}
      className={className}
    />
  );
}
