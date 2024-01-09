import React from 'react';
import classNames from 'classnames';
import { BiEdit, BiXCircle, BiPlusCircle } from 'react-icons/bi';
import { DateTime } from 'luxon';
import { Tooltip } from 'react-tooltip';

import FormButton from '@/components/buttons/FormButton';
import AccountForm from '@/components/forms/account/AccountForm';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import {
  isInvestment,
  isAsset,
  isLiability,
} from '@/book/helpers/accountType';
import { Account, Split } from '@/book/entities';
import { useAccount, useSplits } from '@/hooks/api';

export type HeaderProps = {
  account: Account,
};

export default function Header({
  account,
}: HeaderProps): JSX.Element {
  const { data: parent } = useAccount(account.parentId);
  const { data: splits } = useSplits(account.guid);

  const latestDate = splits?.[0]?.transaction?.date;
  const deletable = splits?.length === 0;

  return (
    <div className="header">
      <span className="title">
        <span
          className={classNames('text-xl font-medium badge', {
            success: account.type === 'INCOME',
            danger: account.type === 'EXPENSE',
            info: isAsset(account),
            warning: isLiability(account),
            misc: isInvestment(account),
          })}
        >
          {account.path}
          {' '}
          account
        </span>
      </span>
      <div className="ml-auto">
        <div className="flex gap-1">
          <FormButton
            id="add-tx"
            modalTitle={`Add transaction to ${account?.name}`}
            buttonContent={(
              <>
                <BiPlusCircle className="mr-1" />
                Add transaction
              </>
            )}
          >
            <TransactionForm
              defaultValues={
                {
                  date: (latestDate || DateTime.now()).toISODate() as string,
                  description: '',
                  splits: [Split.create({ fk_account: account }), new Split()],
                  fk_currency: account.commodity,
                }
              }
            />
          </FormButton>
          <FormButton
            id="edit-account"
            modalTitle="Edit account"
            buttonContent={<BiEdit />}
          >
            <AccountForm
              action="update"
              defaultValues={{
                ...account,
                parent,
              }}
            />
          </FormButton>
          <FormButton
            id="delete-account"
            modalTitle="Confirm you want to remove this account"
            buttonContent={<BiXCircle />}
            className="btn btn-danger"
            disabled={!deletable}
            data-tooltip-id="delete-help"
          >
            <AccountForm
              action="delete"
              defaultValues={{
                ...account,
                parent,
              }}
            />
          </FormButton>
          {
            !deletable
            && (
              <Tooltip
                id="delete-help"
                className="tooltip"
                disableStyleInjection
              >
                <p>
                  Accounts that contain transactions can&apos;t be deleted.
                </p>
                <p>
                  Move the transactions to another account first.
                </p>
              </Tooltip>
            )
          }
        </div>
      </div>
    </div>
  );
}
