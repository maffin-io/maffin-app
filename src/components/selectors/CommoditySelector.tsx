import React from 'react';
import useSWRImmutable from 'swr/immutable';

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
  let { data: commodities } = useSWRImmutable(
    '/api/commodities',
    () => Commodity.find(),
  );

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
