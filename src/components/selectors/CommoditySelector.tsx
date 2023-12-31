import React from 'react';
import {
  Props as SelectProps,
  GroupBase,
} from 'react-select';

import { useCommodities } from '@/hooks/api';
import { Commodity } from '@/book/entities';
import Selector from '@/components/selectors/Selector';

export interface CommoditySelectorProps extends SelectProps<
Commodity,
false,
GroupBase<Commodity>
> {
  namespace?: 'EQUITY' | 'ETF' | 'MUTUALFUND' | 'CURRENCY' | undefined,
}

export default function CommoditySelector(
  {
    namespace,
    placeholder = 'Choose commodity',
    id = 'commoditySelector',
    ...props
  }: CommoditySelectorProps,
): JSX.Element {
  let { data: commodities } = useCommodities();
  commodities = commodities || [];

  if (namespace) {
    commodities = commodities.filter(
      commodity => namespace === commodity.namespace,
    );
  }

  return (
    <Selector<Commodity>
      {...props}
      id={id}
      options={commodities}
      placeholder={placeholder}
      getOptionLabel={(option: Commodity) => option.mnemonic}
      getOptionValue={(option: Commodity) => option.mnemonic}
    />
  );
}
