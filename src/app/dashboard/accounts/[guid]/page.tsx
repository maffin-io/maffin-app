'use client';

import React from 'react';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { BiEdit, BiXCircle } from 'react-icons/bi';
import { Tooltip } from 'react-tooltip';

import Money from '@/book/Money';
import {
  SplitsHistogram,
  TotalLineChart,
  TransactionsTable,
} from '@/components/pages/account';
import StatisticsWidget from '@/components/StatisticsWidget';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';
import AccountFormButton from '@/components/buttons/AccountFormButton';
import { useAccounts, useSplits } from '@/hooks/api';
import Loading from '@/components/Loading';
import {
  isInvestment,
  isAsset,
  isLiability,
} from '@/book/helpers/accountType';
import type { Account } from '@/book/entities';

export type AccountPageProps = {
  params: {
    guid: string,
  },
};

export default function AccountPage({ params }: AccountPageProps): JSX.Element {
  let { data: accounts } = useAccounts();
  let { data: splits } = useSplits(params.guid);
  const latestDate = splits?.[0]?.transaction?.date;

  // We cant use fallback data to set a default as SWR treats
  // fallback data as stale data which means with immutable we will
  // never refresh the data.
  accounts = accounts || {};
  splits = splits || [];

  if (!Object.keys(accounts).length) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  const account = accounts[params.guid] as Account;
  if (!account) {
    return (
      <div className="flex h-screen text-sm place-content-center place-items-center">
        {`Account ${params.guid} does not exist`}
      </div>
    );
  }

  const total = new Money(splits.reduce(
    (acc, split) => acc + split.quantity,
    0,
  ), account.commodity.mnemonic);
  const numMonths = (splits.length && (splits[0].transaction.date.diff(
    splits[splits.length - 1].transaction.date,
    ['months', 'days'],
  ).months || 1)) || 1;
  const average = new Money(total.toNumber() / numMonths, account.commodity.mnemonic);

  let totalKeyword = 'have';
  if (account.type === 'EXPENSE') {
    totalKeyword = 'have spent';
  }
  if (account.type === 'INCOME') {
    totalKeyword = 'have earned';
  }
  if (account.type === 'LIABILITY') {
    totalKeyword = 'owe';
  }

  const currentYear = DateTime.now().year;
  let totalThisYear = 0;
  splits.every(split => {
    if (split.transaction.date.year !== currentYear) {
      return false;
    }

    let { quantity } = split;
    if (accounts?.[split.account.guid].type === 'INCOME') {
      quantity = -quantity;
    }

    totalThisYear += quantity;
    return true;
  });

  return (
    <>
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
            <TransactionFormButton
              account={account}
              defaultValues={
                {
                  date: (latestDate || DateTime.now()).toISODate() as string,
                  description: '',
                  splits: [],
                  fk_currency: account.commodity,
                }
              }
            />
            <AccountFormButton
              defaultValues={{
                ...account,
                parent: accounts[account.parentId],
              }}
              action="update"
            >
              <BiEdit />
            </AccountFormButton>
            <AccountFormButton
              defaultValues={{
                ...account,
                parent: accounts[account.parentId],
              }}
              disabled={splits.length > 0}
              className="btn btn-danger"
              action="delete"
              data-tooltip-id="delete-help"
            >
              <BiXCircle />
            </AccountFormButton>
            {
              splits.length > 0
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
      <div className="grid grid-cols-12">
        <div className="col-span-6">

          <div className="grid grid-cols-12">
            <div className="col-span-6">
              <StatisticsWidget
                className="mr-2"
                title={`You ${totalKeyword} a total of`}
                stats={total.format()}
                description={`with an average of ${average.format()} per month`}
              />
            </div>
            <div className="col-span-6">
              <StatisticsWidget
                title={`This year you ${totalKeyword}`}
                stats={new Money(totalThisYear, account.commodity.mnemonic).format()}
                description="in this account"
              />
            </div>
            <div className="card col-span-12">
              <TotalLineChart account={account} />
            </div>
          </div>
        </div>
        <div className="card col-span-6">
          <div className="flex h-full items-center">
            <SplitsHistogram account={account} />
          </div>
        </div>
      </div>
      <div className="card p-0 mt-4 bg-light-100 dark:bg-dark-800">
        <TransactionsTable account={account} />
      </div>
    </>
  );
}
