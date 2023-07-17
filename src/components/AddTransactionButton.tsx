import React from 'react';
import { BiPlusCircle } from 'react-icons/bi';

import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { Account } from '@/book/entities';
import Modal from '@/components/Modal';

export type AddTransactionButtonProps = {
  account: Account,
  onSave?: Function,
};

export default function AddTransactionButton(
  {
    account,
    onSave = () => {},
  }: AddTransactionButtonProps,
): JSX.Element {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <>
      <Modal
        title="Add transaction"
        open={isModalOpen}
        setOpen={setIsModalOpen}
      >
        <TransactionForm
          onSave={() => {
            onSave();
            setIsModalOpen(false);
          }}
          account={account}
        />
      </Modal>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setIsModalOpen(!isModalOpen)}
      >
        <BiPlusCircle className="mr-1" />
        Add Transaction
      </button>
    </>
  );
}
