import React from 'react';
import { BiImport } from 'react-icons/bi';

import { useDataSource } from '@/hooks';

export default function ImportButton(): JSX.Element {
  const { isLoaded, importBook } = useDataSource();
  const fileImportInput = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        id="menu-item-0"
        type="button"
        role="menuitem"
        disabled={!isLoaded}
        tabIndex={-1}
        className="link inline-block w-full whitespace-nowrap"
        onClick={() => fileImportInput.current !== null && fileImportInput.current.click()}
      >
        <BiImport className="inline-block align-middle mr-1" />
        <span className="inline-block align-middle">Import</span>
      </button>
      <input
        aria-label="importInput"
        className="hidden"
        type="file"
        ref={fileImportInput}
        onChange={(e) => i(e, importBook)}
      />
    </>
  );
}

function i(
  event: React.ChangeEvent<HTMLInputElement>,
  importBook: Function,
) {
  if (event.target.files !== null && event.target.files[0] !== null) {
    const fileReader = new FileReader();
    fileReader.onload = async (loadEvent) => {
      if (loadEvent.target !== null && loadEvent.target.result !== null) {
        const rawBook = new Uint8Array(loadEvent.target.result as ArrayBuffer);
        await importBook(rawBook);
      }
    };

    fileReader.readAsArrayBuffer(event.target.files[0]);
  }
}
