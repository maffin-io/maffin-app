import React from 'react';
import Modal from 'react-modal';
import { BiImport } from 'react-icons/bi';

import DBImportButton from './import/DBImportButton';
import PlaidImportButton from './import/PlaidImportButton';

export interface ImportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  onImport?: Function;
}

export default function ImportButton({
  className = 'btn btn-primary',
  onImport,
  ...props
}: ImportButtonProps): JSX.Element {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <>
      {/* @ts-ignore */}
      <Modal
        isOpen={isModalOpen}
        overlayClassName="overlay"
        className="modal bg-background-800"
      >
        <button
          type="button"
          className="float-right"
          onClick={() => setIsModalOpen(false)}
        >
          X
        </button>
        <div className="grid grid-cols-2 justify-center mt-5">
          <DBImportButton onImport={() => setIsModalOpen(false)} />
          <PlaidImportButton onImport={() => setIsModalOpen(false)} />
        </div>
      </Modal>
      <button
        id="import-button"
        type="button"
        className={className}
        onClick={() => setIsModalOpen(!isModalOpen)}
        {...props}
      >
        <BiImport className="inline-block align-middle mr-1" />
        <span className="inline-block align-middle">Import</span>
      </button>
    </>
  );
}
