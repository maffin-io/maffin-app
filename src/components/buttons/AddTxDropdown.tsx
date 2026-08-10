import React from 'react';
import { DateTime } from 'luxon';
import {
  BiDroplet,
  BiMoney,
  BiPlusCircle,
  BiShareAlt,
} from 'react-icons/bi';

import FormButton from '@/components/buttons/FormButton';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { Split } from '@/book/entities';
import type { Account } from '@/book/entities';

export type AddTxDropdownProps = {
  account: Account,
  latestDate: DateTime,
};

export default function AddTxDropdown({
  account,
  latestDate,
}: AddTxDropdownProps): React.JSX.Element {
  return (
    <div className="group relative h-full">
      <button
        type="button"
        className="group-hover:bg-cyan-700/80 dark:group-hover:bg-cyan-600 flex h-full w-full items-center btn btn-primary"
      >
        <BiPlusCircle className="mr-1" />
        Add
      </button>
      <ul className="absolute rounded-md w-40 hidden py-2 group-hover:block bg-background-800">
        <li className="text-sm hover:bg-background-700">
          <FormButton
            id="add-tx"
            className="flex items-center text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap"
            modalTitle={`Add transaction to ${account.name}`}
            buttonContent={(
              <>
                <BiShareAlt className="mr-1" />
                Transaction
              </>
            )}
          >
            <TransactionForm
              defaultValues={
                {
                  date: (latestDate || DateTime.now()).toISODate() as string,
                  description: '',
                  splits: [
                    Split.create({ fk_account: account }),
                    {} as Split,
                  ],
                  fk_currency: account.commodity,
                }
              }
            />
          </FormButton>
        </li>
        {
          account.type === 'INVESTMENT'
          && (
            <>
              <li className="text-sm hover:bg-light-100 dark:hover:bg-dark-700">
                <FormButton
                  id="add-dividend"
                  className="flex items-center text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap"
                  modalTitle={`Add dividend to ${account.name}`}
                  buttonContent={(
                    <>
                      <BiMoney className="mr-1" />
                      Dividend
                    </>
                  )}
                >
                  <TransactionForm
                    defaultValues={
                      {
                        date: (latestDate || DateTime.now()).toISODate() as string,
                        description: `Dividend ${account.name}`,
                        fk_currency: account.commodity,
                        splits: [
                          Split.create({
                            fk_account: account,
                            valueNum: 0,
                            valueDenom: 1,
                            quantityNum: 0,
                            quantityDenom: 1,
                          }),
                          Split.create({
                            fk_account: {
                              type: 'INCOME',
                            },
                          }),
                          Split.create({
                            fk_account: {
                              type: 'ASSET',
                            },
                          }),
                        ],
                      }
                    }
                  />
                </FormButton>
              </li>
              <li className="text-sm hover:bg-light-100 dark:hover:bg-dark-700">
                <FormButton
                  id="add-split"
                  className="flex items-center text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap"
                  modalTitle={`Add split event to ${account.name}`}
                  buttonContent={(
                    <>
                      <BiDroplet className="mr-1" />
                      Split
                    </>
                  )}
                >
                  <TransactionForm
                    defaultValues={
                      {
                        date: (latestDate || DateTime.now()).toISODate() as string,
                        description: `Split ${account.name}`,
                        fk_currency: account.commodity,
                        splits: [
                          Split.create({
                            fk_account: account,
                            valueNum: 0,
                            valueDenom: 1,
                            quantityNum: 0,
                            quantityDenom: 1,
                          }),
                        ],
                      }
                    }
                  />
                </FormButton>
              </li>
            </>
          )
        }
      </ul>
    </div>
  );
}
