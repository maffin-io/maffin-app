import React from 'react';
import classNames from 'classnames';
import { BiEdit, BiXCircle, BiPlusCircle } from 'react-icons/bi';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';

import { Tooltip } from '@/components/tooltips';
import FormButton from '@/components/buttons/FormButton';
import AccountForm from '@/components/forms/account/AccountForm';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import {
  isInvestment,
  isAsset,
  isLiability,
} from '@/book/helpers/accountType';
import { Account, Split } from '@/book/entities';
import { useAccount, useSplitsPagination } from '@/hooks/api';
import { useInterval } from '@/hooks/state';
import Link from 'next/link';

export type HeaderProps = {
  account: Account,
};

export default function Header({
  account,
}: HeaderProps): JSX.Element {
  const { data: parent } = useAccount(account.parentId);
  const { data: interval } = useInterval();
  const { data: splits } = useSplitsPagination(account.guid, interval);
  const router = useRouter();

  const latestDate = splits?.[0]?.transaction?.date;
  const deletable = splits?.length === 0;

  let title: string | JSX.Element = account.path;
  if (account.path.lastIndexOf(':') > 0) {
    const parentPath = account.path.slice(0, account.path.lastIndexOf(':'));
    title = (
      <span>
        <Link
          href={`/dashboard/accounts/${account.parentId}`}
          className={classNames('text-white text-opacity-50 hover:text-current')}
        >
          {parentPath}
        </Link>
        :
        {account.name}
      </span>
    );
  }

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
          {title}
        </span>
      </span>
      <div className="ml-auto">
        <div
          className={classNames(
            'flex gap-1',
            {
              hidden: account.parentId === 'rootAccount',
            },
          )}
        >
          <div
            className={classNames(
              '',
              {
                hidden: account.placeholder,
              },
            )}
          >
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
          </div>
          <FormButton
            id="edit-account"
            modalTitle="Edit account"
            buttonContent={<BiEdit className="text-sm" />}
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
            buttonContent={<BiXCircle className="text-sm" />}
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
              onSave={
                () => { router.replace('/dashboard/accounts'); }
              }
            />
          </FormButton>
          {
            !deletable
            && (
              <Tooltip
                id="delete-help"
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
