import React from 'react';
import { BiImport } from 'react-icons/bi';

import Modal, { ModalRef } from '@/components/ui/Modal';
import DBImportButton from './import/DBImportButton';
import PlaidImportButton from './import/PlaidImportButton';

export interface ImportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export default function ImportButton({
  className = 'btn btn-primary',
}: ImportButtonProps): JSX.Element {
  const modalRef = React.useRef<ModalRef>(null);

  return (
    <Modal
      className="modal bg-background-800"
      ref={modalRef}
      triggerContent={(
        <>
          <BiImport className="inline-block align-middle mr-1" />
          <span className="inline-block align-middle">Import</span>
        </>
      )}
      triggerProps={{ className }}
      showClose
    >
      <div className="grid grid-cols-2 justify-center mt-5">
        <DBImportButton onImport={() => modalRef.current?.closeModal()} />
        <PlaidImportButton onImport={() => modalRef.current?.closeModal()} />
      </div>
    </Modal>
  );
}
