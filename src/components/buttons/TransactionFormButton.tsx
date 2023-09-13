import React from 'react';
import Modal from 'react-modal';
import { BiPlusCircle } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import type { FormValues } from '@/components/forms/transaction/types';
import {
  Account,
  Commodity,
  Split,
  Transaction,
} from '@/book/entities';

export type TransactionFormButtonProps = {
  action?: 'add' | 'update' | 'delete',
  guid?: string, // The transaction to update or delete
  account?: Account, // Account to populate for the main split
  defaultValues?: FormValues,
  className?: string,
  children?: React.ReactNode,
};

export default function TransactionFormButton(
  {
    action = 'add',
    guid,
    account,
    defaultValues,
    children,
    className = 'btn-primary',
  }: TransactionFormButtonProps,
): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [defaults, setDefaults] = React.useState(defaultValues);

  let title = 'Add transaction';
  if (action === 'update') {
    title = 'Edit transaction';
  }
  if (action === 'delete') {
    title = 'Confirm you want to remove this transaction';
  }

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
        <span>{title}</span>
        <TransactionForm
          action={action}
          onSave={() => {
            save();
            setIsModalOpen(false);
          }}
          defaultValues={defaults}
        />
      </Modal>
      <button
        type="button"
        className={className}
        onClick={async () => {
          if (action === 'add') {
            const split1 = new Split();
            if (account) {
              split1.fk_account = account;
            }

            const split2 = new Split();
            setDefaults({
              ...defaultValues,
              splits: [split1, split2],
            } as FormValues);
          } else if (action === 'update' || action === 'delete') {
            const tx = await Transaction.findOneOrFail({
              where: { guid },
              relations: {
                splits: {
                  fk_account: true,
                },
              },
            });
            setDefaults({
              ...tx,
              date: tx.date.toISODate() as string,
              fk_currency: tx.currency as Commodity,
            });
          }
          setIsModalOpen(!isModalOpen);
        }}
      >
        {
          children
          || (
            <>
              <BiPlusCircle className="mr-1" />
              <span>Add Transaction</span>
            </>
          )
        }
      </button>
    </>
  );
}
