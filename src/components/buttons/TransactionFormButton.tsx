import React from 'react';
import { BiPlusCircle } from 'react-icons/bi';
import Modal from 'react-modal';

import { DataSourceContext } from '@/hooks';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import type { FormValues } from '@/components/forms/transaction/types';
import {
  Account,
  Split,
  Transaction,
} from '@/book/entities';

export interface TransactionFormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  account?: Account, // Account to populate for the main split
  action?: 'add' | 'update' | 'delete',
  defaultValues?: Partial<FormValues>,
}

export default function TransactionFormButton({
  action = 'add',
  account,
  defaultValues,
  children,
  className = 'btn btn-primary',
}: TransactionFormButtonProps): JSX.Element {
  const { save } = React.useContext(DataSourceContext);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [defaults, setDefaults] = React.useState<Partial<FormValues>>();

  let title = `Add transaction to ${account?.name}`;
  if (action === 'update') {
    title = 'Edit transaction';
  }
  if (action === 'delete') {
    title = 'Confirm you want to remove this transaction';
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
        id="add-tx"
        type="button"
        className={className}
        onClick={async () => {
          if (action === 'add') {
            const split1 = new Split();
            if (account) {
              split1.fk_account = account;
            }

            setDefaults({
              ...defaultValues,
              splits: [split1, new Split()],
            } as FormValues);
          } else if (action === 'update' || action === 'delete') {
            const tx = await Transaction.findOneOrFail({
              where: { guid: defaultValues?.guid },
              relations: {
                splits: {
                  fk_account: true,
                },
              },
            });
            setDefaults({
              ...defaultValues,
              // The currency is not loaded in the transactions table view
              // so we load it here.
              fk_currency: tx.currency,
              // This is hacky but if we pass the Split
              // class to the form, then we have reference errors as when
              // we update the form, it also updates the defaultValues
              // which means formState.isDirty is not triggered properly
              splits: tx.splits.map(split => ({
                ...split,
                value: split.value,
                quantity: split.quantity,
              } as Split)),
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
