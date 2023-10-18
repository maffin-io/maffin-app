import React from 'react';

import { useCommodities } from '@/hooks/api';
import { Commodity } from '@/book/entities';
import { SingleValue, components } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { BiSearch } from 'react-icons/bi';
import Stocker from '@/apis/Stocker';

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
  const ref = React.useRef<HTMLDivElement>();
  let { data: commodities } = useCommodities();
  commodities = commodities || [];
  commodities = commodities.filter(
    commodity => !(ignoreNamespaces).includes(commodity.namespace),
  );

  return (
    <AsyncCreatableSelect<Commodity>
      id={id}
      cacheOptions
      defaultOptions={commodities}
      loadOptions={async (inputValue: string) => {
        const result = await new Stocker().search(inputValue);
        console.log(result);
        return (commodities || []).filter(
          c => c.mnemonic.toLowerCase().includes(inputValue.toLowerCase()),
        );
      }}
      placeholder={placeholder || 'Choose commodity'}
      isClearable={isClearable}
      defaultValue={defaultValue}
      getOptionLabel={(option: Commodity) => {
        let label = option.mnemonic;
        if (!commodities?.find(c => c.guid === option.guid)) {
          label = `Create '${option.mnemonic}' ${option.namespace.toLowerCase()}`;
        }

        return label;
      }}
      onChange={(newValue: SingleValue<Commodity> | null) => {
        if (onChange) {
          onChange(newValue);
        }
        ref.current?.blur();
      }}
      isDisabled={disabled}
      getOptionValue={(option: Commodity) => option.mnemonic}
      getNewOptionData={(value) => Commodity.create({
        mnemonic: value,
        namespace: 'CURRENCY',
      })}
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
