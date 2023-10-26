import React from 'react';
import debounce from 'debounce-promise';
import {
  Props as SelectProps,
  GroupBase,
} from 'react-select';

import { useCommodities } from '@/hooks/api';
import { Commodity } from '@/book/entities';
import { search } from '@/apis/Stocker';
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
  const [isLoading, setIsLoading] = React.useState(false);
  let { data: commodities } = useCommodities();
  commodities = commodities || [];

  if (namespace) {
    commodities = commodities.filter(
      commodity => namespace === commodity.namespace,
    );
  }

  const debouncedSearch = debounce(search, 1000);
  const loadCommodities = React.useCallback(
    async (inputValue: string) => {
      const filteredDefaults = [];
      let exactMatch = false;

      (commodities || []).forEach(c => {
        if (c.mnemonic.toLowerCase().includes(inputValue.toLowerCase())) {
          filteredDefaults.push(c);
          if (inputValue.toLowerCase() === c.mnemonic.toLowerCase()) {
            exactMatch = true;
          }
        }
      });

      if (!exactMatch) {
        setIsLoading(true);
        const result = await debouncedSearch(inputValue, namespace);
        if (result) {
          filteredDefaults.push(
            Commodity.create({
              mnemonic: result.ticker,
              namespace: result.namespace,
              fullname: result.name,
            }),
          );
        }
        setIsLoading(false);
      }

      return filteredDefaults;
    },
    [commodities, namespace, debouncedSearch],
  );

  return (
    <Selector<Commodity>
      {...props}
      id={id}
      cacheOptions
      creatable
      isLoading={isLoading}
      defaultOptions={commodities}
      loadOptions={loadCommodities}
      placeholder={placeholder}
      getOptionLabel={
        (option: Commodity | { label: string, value: string, __isNew__: boolean }) => {
          if (!(option instanceof Commodity)) {
            option = Commodity.create({
              mnemonic: option.value.toUpperCase(),
              namespace: 'UNKNOWN',
            });
          }
          let label = option.mnemonic;
          if (!commodities?.find(c => c.guid === (option as Commodity).guid)) {
            label = `${option.namespace}: ${option.mnemonic}`;
            if (option.fullname) {
              label = `${label} (${option.fullname})`;
            }
          }

          return label;
        }
      }
      getOptionValue={(option: Commodity) => option.mnemonic}
    />
  );
}
