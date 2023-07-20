import React from 'react';
import Modal from '@/components/Modal';
import { BiPlusCircle } from 'react-icons/bi';

import AccountForm from '@/components/forms/account/AccountForm';

export type AddAccountButtonProps = {
  onSave?: Function,
};

export default function AddAccountButton(
  {
    onSave = () => {},
  }: AddAccountButtonProps,
): JSX.Element {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <>
      <Modal
        title="Add account"
        open={isModalOpen}
        setOpen={setIsModalOpen}
      >
        <AccountForm
          onSave={() => {
            onSave();
            setIsModalOpen(false);
          }}
        />
      </Modal>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setIsModalOpen(!isModalOpen)}
      >
        <BiPlusCircle className="mr-1" />
        Add Account
      </button>
    </>
  );
}
