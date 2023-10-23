import React from 'react';

import { useCommodities } from '@/hooks/api';
import { Commodity } from '@/book/entities';
import Selector from '@/components/selectors/Selector';

export type CommoditySelectorProps = {
  placeholder?: string,
  ignoreNamespaces?: string[],
  defaultValue?: Commodity,
  id?: string,
  isClearable?: boolean,
  disabled?: boolean,
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
    disabled = false,
    className = '',
    onChange = () => {},
  }: CommoditySelectorProps,
): JSX.Element {
  let { data: commodities } = useCommodities();
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
      disabled={disabled}
      defaultValue={defaultValue}
      className={className}
    />
  );
}
