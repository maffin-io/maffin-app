import React from 'react';
import Modal from 'react-modal';
import { BiPlusCircle } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';
import AccountForm from '@/components/forms/account/AccountForm';
import type { FormValues } from '@/components/forms/account/types';

export type AccountFormButtonProps = {
  action?: 'add' | 'update',
  defaultValues?: Partial<FormValues>,
  children?: React.ReactNode,
};

export default function AccountFormButton({
  action = 'add',
  defaultValues,
  children,
}: AccountFormButtonProps): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  let title = 'Add account';
  if (action === 'update') {
    title = `Edit ${defaultValues?.name} account`;
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
        className="btn btn-primary"
        onClick={() => setIsModalOpen(!isModalOpen)}
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
