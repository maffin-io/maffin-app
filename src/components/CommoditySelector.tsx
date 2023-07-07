import React from 'react';
import Select, {
  SingleValue,
  components,
} from 'react-select';
import { BiMoney } from 'react-icons/bi';

import { Commodity } from '@/book/entities';
import { useDataSource } from '@/hooks';

export type CommoditySelectorProps = {
  id?: string,
  placeholder?: string,
  onChange?: Function,
  ignoreNamespaces?: string[],
  className?: string,
};

export default function CommoditySelector(
  {
    placeholder,
    onChange,
    ignoreNamespaces,
    id = 'accountSelector',
    className = '',
  }: CommoditySelectorProps,
): JSX.Element {
  const ref = React.useRef<HTMLDivElement>();
  const [datasource] = useDataSource();
  const [commodities, setCommodities] = React.useState<Commodity[]>([]);

  React.useEffect(() => {
    async function load() {
      if (datasource) {
        setCommodities(await Commodity.find());
      }
    }

    load();
  }, [datasource]);

  return (
    <Select
      // @ts-ignore
      ref={ref}
      id={id}
      name={id}
      aria-label={id}
      options={commodities.filter(
        commodity => !(ignoreNamespaces || []).includes(commodity.namespace),
      )}
      placeholder={placeholder || 'Choose commodity'}
      onChange={(newValue: SingleValue<Commodity> | null) => {
        if (onChange) {
          onChange(newValue);
        }
      }}
      isClearable
      backspaceRemovesValue
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          ref.current?.blur();
        }
      }}
      getOptionLabel={(option) => option.mnemonic}
      getOptionValue={(option) => option.mnemonic}
      openMenuOnFocus
      components={{ Control }}
      className={className}
      styles={{
        option: () => ({}),
      }}
      classNames={{
        // We set h-9 so it's the same as other inputs
        control: () => '!h-9 !min-h-fit text-sm pl-10 !bg-gunmetal-800 !border-none',
        indicatorSeparator: () => 'hidden',
        menu: () => 'text-sm !bg-gunmetal-800',
        option: (state) => {
          const styles = 'w-full cursor-default hover:bg-gunmetal-700 px-4 py-2';
          if (state.isFocused) {
            // For some reason putting focus:bg-gunmetal-700 doesnt work
            return `bg-gunmetal-700 ${styles}`;
          }
          return styles;
        },
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
      <BiMoney className="absolute text-md left-[10px]" />
      {children}
    </components.Control>
  );
}
