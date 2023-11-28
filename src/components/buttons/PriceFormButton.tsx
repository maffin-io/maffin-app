import React from 'react';
import Modal from 'react-modal';
import { BiPlusCircle } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';
import PriceForm from '@/components/forms/price/PriceForm';
import { FormValues } from '@/components/forms/price/types';

export interface PriceFormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action?: 'add' | 'update' | 'delete',
  defaultValues?: Partial<FormValues>,
}

export default function PriceFormButton({
  action = 'add',
  defaultValues,
  children,
  className = 'btn btn-primary',
  ...props
}: PriceFormButtonProps): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  let title = 'Add price';
  if (action === 'update') {
    title = `Edit ${defaultValues?.guid} price`;
  }
  if (action === 'delete') {
    title = 'Confirm you want to remove this price';
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
        <PriceForm
          action={action}
          defaultValues={defaultValues}
          hideDefaults
          onSave={() => {
            save();
            setIsModalOpen(false);
          }}
        />
      </Modal>
      <button
        id="add-price"
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
              Add Price
            </>
          )
        }
      </button>
    </>
  );
}
