import React from 'react';
import Modal from 'react-modal';
import { BiPlusCircle } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';
import AccountForm from '@/components/forms/account/AccountForm';
import type { FormValues } from '@/components/forms/account/types';

export interface AccountFormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action?: 'add' | 'update' | 'delete',
  defaultValues?: Partial<FormValues>,
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

  let title = 'Add account';
  if (action === 'update') {
    title = `Edit ${defaultValues?.name} account`;
  }
  if (action === 'delete') {
    title = 'Confirm you want to remove this account';
  }

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
        <span>{title}</span>
        <AccountForm
          action={action}
          defaultValues={defaultValues}
          onSave={() => {
            save();
            setIsModalOpen(false);
          }}
        />
      </Modal>
      <button
        id="add-account"
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
              Add Account
            </>
          )
        }
      </button>
    </>
  );
}
