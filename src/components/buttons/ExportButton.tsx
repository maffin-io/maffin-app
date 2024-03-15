import React from 'react';
import { BiExport } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';

export interface ImportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export default function ImportButton({
  className = 'btn btn-primary',
  ...props
}: ImportButtonProps): JSX.Element {
  const { isLoaded, datasource } = React.useContext(DataSourceContext);
  const ref = React.useRef<HTMLAnchorElement>(null);

  return (
    <>
      <button
        id="export-button"
        type="button"
        disabled={!isLoaded}
        className={className}
        onClick={() => {
          if (ref.current) {
            const rawBook = datasource?.sqljsManager.exportDatabase() as Uint8Array;
            const blob = new Blob([rawBook], { type: 'application/vnd.sqlite3' });
            ref.current.href = window.URL.createObjectURL(blob);
            ref.current.click();
          }
        }}
        {...props}
      >
        <BiExport className="inline-block align-middle mr-1" />
        <span className="inline-block align-middle">Export</span>
      </button>
      <a
        className="hidden"
        href="/#"
        ref={ref}
        download="book.sqlite"
      >
        Download
      </a>
    </>
  );
}
