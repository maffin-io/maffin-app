import React from 'react';
import { BiImport } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';

export interface ImportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  onImport?: Function;
}

export default function ImportButton({
  className = 'btn btn-primary',
  onImport,
  ...props
}: ImportButtonProps): JSX.Element {
  const { isLoaded, importBook } = React.useContext(DataSourceContext);
  const fileImportInput = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        id="import-button"
        type="button"
        disabled={!isLoaded}
        className={className}
        onClick={() => fileImportInput.current !== null && fileImportInput.current.click()}
        {...props}
      >
        <BiImport className="inline-block align-middle mr-1" />
        <span className="inline-block align-middle">Import</span>
      </button>
      <input
        aria-label="importInput"
        className="hidden"
        type="file"
        ref={fileImportInput}
        onChange={(e) => i(e, importBook, onImport)}
      />
    </>
  );
}

function i(
  event: React.ChangeEvent<HTMLInputElement>,
  importBook: Function,
  onImport?: Function,
) {
  if (event.target.files !== null && event.target.files[0] !== null) {
    const fileReader = new FileReader();
    fileReader.onload = async (loadEvent) => {
      if (loadEvent.target !== null && loadEvent.target.result !== null) {
        const rawBook = new Uint8Array(loadEvent.target.result as ArrayBuffer);
        await importBook(rawBook);
        onImport?.();
      }
    };

    fileReader.readAsArrayBuffer(event.target.files[0]);
  }
}
