import React from 'react';
import { BiPlusCircle } from 'react-icons/bi';

import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { Account } from '@/book/entities';
import Modal from '@/components/Modal';
import Tooltip from '@/components/Tooltip';

type AddTransactionButtonProps = {
  account: Account,
};

export default function AddTransactionButton(
  {
    account,
  }: AddTransactionButtonProps,
): JSX.Element {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const disabled = ['INCOME', 'EXPENSE'].includes(account.type);

  return (
    <>
      <Modal
        title={`${account.path} transaction`}
        open={isModalOpen}
        setOpen={setIsModalOpen}
      >
        <TransactionForm
          onSave={() => { setIsModalOpen(false); }}
          account={account}
        />
      </Modal>
      <Tooltip
        text="Add transactions from accounts that are not INCOME/EXPENSE/STOCK/MUTUAL"
        show={disabled}
      >
        <button
          type="button"
          className="btn-primary"
          disabled={disabled}
          onClick={() => setIsModalOpen(!isModalOpen)}
        >
          <BiPlusCircle className="mr-1" />
          Add Transaction
        </button>
      </Tooltip>
    </>
  );
}
