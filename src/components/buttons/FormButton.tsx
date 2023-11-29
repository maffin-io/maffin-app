import React from 'react';
import Modal from 'react-modal';

import { DataSourceContext } from '@/hooks';
import type CommodityForm from '@/components/forms/commodity/CommodityForm';

export interface AccountFormButtonProps extends Omit<
React.ButtonHTMLAttributes<HTMLButtonElement>,
'children'
> {
  action?: 'add' | 'update' | 'delete',
  buttonText?: string,
  children: React.ReactElement<typeof CommodityForm>,
}

export default function AccountFormButton({
  buttonText = 'save',
  children,
  className = 'btn btn-primary',
  ...props
}: AccountFormButtonProps): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const title = 'Add commodity';

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
        <span>{title}</span>
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
      </Modal>
      <button
        id="add-commodity"
        type="button"
        onClick={() => setIsModalOpen(!isModalOpen)}
        className={className}
        {...props}
      >
        {buttonText}
      </button>
    </>
  );
}
