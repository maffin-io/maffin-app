import React from 'react';
import debounce from 'lodash.debounce';

export type SearchBoxProps = {
  onChange: Function,
};

export default function SearchBox({
  onChange,
}: SearchBoxProps): React.JSX.Element {
  const debounced = debounce(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target?.value),
    500,
  );

  return (
    <input
      onChange={debounced}
      placeholder="Search..."
    />
  );
}
