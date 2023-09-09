import React from 'react';
import { BiPlusCircle } from 'react-icons/bi';

import { DataSourceContext } from '@/hooks';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import Modal from '@/components/Modal';
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
        title={title}
        open={isModalOpen}
        setOpen={setIsModalOpen}
      >
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
