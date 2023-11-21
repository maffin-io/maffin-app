import React from 'react';
import Modal from 'react-modal';
import { BiPlusCircle } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
import type { Commodity } from '@/book/entities';

export interface AccountFormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action?: 'add' | 'update' | 'delete',
  defaultValues?: Partial<Commodity>,
}

export default function AccountFormButton({
  action = 'add',
  defaultValues,
  children,
  className = 'btn btn-primary',
  ...props
}: AccountFormButtonProps): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  let title = 'Add commodity';
  if (action === 'update') {
    title = `Edit ${defaultValues?.mnemonic} commodity`;
  }
  if (action === 'delete') {
    title = 'Confirm you want to remove this commodity';
  }

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
        <CommodityForm
          action={action}
          defaultValues={defaultValues}
          onSave={() => {
            save();
            setIsModalOpen(false);
          }}
        />
      </Modal>
      <button
        id="add-commodity"
        type="button"
        onClick={() => setIsModalOpen(!isModalOpen)}
        className={className}
        {...props}
      >
        {
          children
          || (
            <>
              <BiPlusCircle className="mr-1" />
              Add Commodity
            </>
          )
        }
      </button>
    </>
  );
}
