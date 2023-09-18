import React from 'react';
import Modal from 'react-modal';
import { BiPlusCircle } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';
import AccountForm from '@/components/forms/account/AccountForm';

export default function AddAccountButton(): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        overlayClassName="fixed inset-0 bg-white bg-opacity-30 overflow-y-auto h-full w-full z-50"
        className="relative top-20 mx-auto p-5 w-1/3 shadow-lg rounded-md bg-gunmetal-700"
      >
        <button
          type="button"
          className="float-right"
          onClick={() => setIsModalOpen(false)}
        >
          X
        </button>
        <span>Add account</span>
        <AccountForm
          onSave={() => {
            save();
            setIsModalOpen(false);
          }}
        />
      </Modal>
      <button
        id="add-account"
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
