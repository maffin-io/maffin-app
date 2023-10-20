import React from 'react';
import debounce from 'debounce-promise';

import { useCommodities } from '@/hooks/api';
import { Commodity } from '@/book/entities';
import { SingleValue, components } from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { BiSearch } from 'react-icons/bi';
import Stocker from '@/apis/Stocker';

export type CommoditySelectorProps = {
  placeholder?: string,
  namespace?: 'EQUITY' | 'ETF' | 'MUTUALFUND' | 'CURRENCY' | undefined,
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
    namespace,
    defaultValue,
    id = 'commoditySelector',
    isClearable = true,
    disabled = false,
    className = '',
    onChange = () => {},
  }: CommoditySelectorProps,
): JSX.Element {
  const ref = React.useRef<HTMLDivElement>();
  const [isLoading, setIsLoading] = React.useState(false);
  let { data: commodities } = useCommodities();
  console.log(commodities);
  commodities = commodities || [];

  if (namespace) {
    commodities = commodities.filter(
      commodity => namespace === commodity.namespace,
    );
  }

  const loadCommodities = React.useCallback(
    async (inputValue: string) => {
      setIsLoading(true);
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
        const result = await new Stocker().search(inputValue, namespace);
        if (result) {
          filteredDefaults.push(
            Commodity.create({
              mnemonic: result.ticker,
              namespace: result.namespace,
              fullname: result.name,
            }),
          );
        }
      }

      setIsLoading(false);
      return filteredDefaults;
    },
    [commodities],
  );

  const debouncedSearch = debounce(loadCommodities, 1000);

  return (
    <AsyncCreatableSelect<Commodity>
      id={id}
      cacheOptions
      isLoading={isLoading}
      defaultOptions={commodities}
      loadOptions={debouncedSearch}
      placeholder={placeholder || 'Choose commodity'}
      isClearable={isClearable}
      defaultValue={defaultValue}
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
      onChange={(newValue: SingleValue<Commodity> | null) => {
        if (onChange) {
          onChange(newValue);
        }
        ref.current?.blur();
      }}
      isDisabled={disabled}
      getOptionValue={(option: Commodity) => option.mnemonic}
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
