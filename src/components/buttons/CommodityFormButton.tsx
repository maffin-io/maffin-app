import React from 'react';
import Modal from 'react-modal';
import { BiPlusCircle } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
import { FormValues } from '@/components/forms/commodity/types';

export interface CommodityFormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action?: 'add' | 'update' | 'delete',
  defaultValues?: Partial<FormValues>,
}

export default function CommodityFormButton({
  action = 'add',
  defaultValues,
  children,
  className = 'btn btn-primary',
  ...props
}: CommodityFormButtonProps): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <>
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
        <span>Add commodity</span>
        <CommodityForm
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
