import React from 'react';
import Modal from 'react-modal';

import { DataSourceContext } from '@/hooks';

export interface FormButtonProps extends Omit<
React.ButtonHTMLAttributes<HTMLButtonElement>,
'children'
> {
  buttonContent: string | React.ReactElement,
  modalTitle: string,
  children: React.ReactElement,
}

export default function FormButton({
  buttonContent,
  modalTitle,
  children,
  className = 'btn btn-primary',
  ...props
}: FormButtonProps): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <>
      {/* @ts-ignore */}
      <Modal
        isOpen={isModalOpen}
        overlayClassName="overlay"
        className="modal"
      >
        <button
          type="button"
          className="float-right"
          onClick={() => setIsModalOpen(false)}
        >
          X
        </button>
        <span>{modalTitle}</span>
        <div>
          {
            React.cloneElement(
              children,
              {
                onSave: () => {
                  save();
                  setIsModalOpen(false);
                },
              },
            )
          }
        </div>
      </Modal>
      <button
        type="button"
        onClick={() => setIsModalOpen(!isModalOpen)}
        className={className}
        {...props}
      >
        {buttonContent}
      </button>
    </>
  );
}
