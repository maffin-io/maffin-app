import React from 'react';
import Image from 'next/image';

import { DataSourceContext } from '@/hooks';
import { Tooltip } from '@/components/tooltips';
import maffinLogo from '@/assets/images/maffin_logo_sm.png';

export interface ImportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  onImport?: Function;
}

export default function DBImportButton({
  className = '',
  onImport,
  ...props
}: ImportButtonProps): JSX.Element {
  const { isLoaded, importBook } = React.useContext(DataSourceContext);
  const fileImportInput = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        id="db-import-button"
        type="button"
        disabled={!isLoaded}
        onClick={() => fileImportInput.current !== null && fileImportInput.current.click()}
        className={className}
        {...props}
      >
        <div className="card hover:text-cyan-600 dark:hover:text-white hover:shadow-xl">
          <span
            className="float-right badge default -mt-2 -mr-2"
            data-tooltip-id="db-import-help"
          >
            ?
          </span>
          <Tooltip
            id="db-import-help"
          >
            <p className="mb-2 text-xs">
              A previously exported file from Maffin. Replaces all current data with the new one.
            </p>
          </Tooltip>
          <div className="flex items-center">
            <Image className="m-0" src={maffinLogo} alt="" height="65" />
            <span className="inline-block align-middle">Maffin DB</span>
          </div>
        </div>
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
