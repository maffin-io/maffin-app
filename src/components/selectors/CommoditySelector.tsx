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
  namespace?: 'OTHER' | 'STOCK' | 'MUTUAL' | 'CURRENCY' | undefined,
  ignore?: string[], // guid of Commodities to not show
}

export default function CommoditySelector(
  {
    namespace,
    ignore,
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

  if (ignore) {
    commodities = commodities.filter(
      commodity => !ignore.includes(commodity.guid),
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
