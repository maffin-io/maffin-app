'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import classNames from 'classnames';
import { DateTime } from 'luxon';

import Money from '@/book/Money';
import SplitsHistogram from '@/components/pages/account/SplitsHistogram';
import TotalLineChart from '@/components/pages/account/TotalLineChart';
import StatisticsWidget from '@/components/StatisticsWidget';
import { Split } from '@/book/entities';
import TransactionsTable from '@/components/TransactionsTable';
import AddTransactionButton from '@/components/buttons/AddTransactionButton';
import { getAccountsWithPath } from '@/book/queries';
import { useDataSource } from '@/hooks';

export type AccountPageProps = {
  params: {
    guid: string,
  },
};

export default function AccountPage({ params }: AccountPageProps): JSX.Element {
  const { save } = useDataSource();
  let { data: accounts } = useSWRImmutable(
    '/api/accounts',
    getAccountsWithPath,
  );
  let { data: splits } = useSWRImmutable(
    `/api/splits/${params.guid}`,
    () => {
      const start = performance.now();
      const sps = Split.find({
        where: {
          fk_account: {
            guid: params.guid,
          },
        },
        relations: {
          fk_transaction: {
            splits: {
              fk_account: true,
            },
          },
          fk_account: true,
        },
        order: {
          fk_transaction: {
            date: 'DESC',
          },
          // This is so debit is always before credit
          // so we avoid negative amounts when display
          // partial totals
          quantityNum: 'ASC',
        },
      });
      const end = performance.now();
      console.log(`get splits: ${end - start}ms`);
      return sps;
    },
  );

  const router = useRouter();
  // We cant use fallback data to set a default as SWR treats
  // fallback data as stale data which means with immutable we will
  // never refresh the data.
  accounts = accounts || [];
  splits = splits || [];

  if (!accounts.length) {
    return (
      <div>
        Loading...
      </div>
    );
  }

  const account = accounts.find(a => a.guid === params.guid);
  if (!account) {
    router.push('/404');
    return (
      <div>
        Loading...
      </div>
    );
  }
  account.splits = splits;
  const { total } = account;
  const average = new Money(total.toNumber() / (splits.length && (splits[0].transaction.date.diff(
    splits[splits.length - 1].transaction.date,
    ['months', 'days'],
  ).months || 1)) || 0, account.commodity.mnemonic);
  // Setting to empty as this creates errors when rendering
  // transaction form and couldnt find why.
  account.splits = [];

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
    if (split.account.type === 'INCOME') {
      quantity = -quantity;
    }

    totalThisYear += quantity;
    return true;
  });

  return (
    <>
      <div className="grid grid-cols-12 items-center pb-4">
        <span className="col-span-10">
          <span
            className={classNames('text-xl font-medium badge', {
              'bg-green-500/20 text-green-300': account.type === 'INCOME',
              'bg-red-500/20 text-red-300': account.type === 'EXPENSE',
              'bg-cyan-500/20 text-cyan-300': ['ASSET', 'BANK'].includes(account.type),
              'bg-orange-500/20 text-orange-300': account.type === 'LIABILITY',
              'bg-violet-500/20 text-violet-300': ['STOCK', 'MUTUAL'].includes(account.type),
            })}
          >
            {account.path}
            {' '}
            account
          </span>
        </span>
        <div className="col-span-2 col-end-13 justify-self-end">
          <AddTransactionButton
            account={account}
            onSave={() => {
              save();
              mutate(`/api/splits/${params.guid}`);
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-12">
        <div className="col-span-6">

          <div className="grid grid-cols-12">
            <div className="col-span-6">
              <StatisticsWidget
                className="mr-6"
                title={`You ${totalKeyword} a total of`}
                stats={total.format()}
                description={`with an average of ${average.format()} per month`}
              />
            </div>
            <div className="col-span-6">
              <StatisticsWidget
                className="mr-6"
                title="This year there's been a change of"
                stats={new Money(totalThisYear, account.commodity.mnemonic).format()}
                description="for this account"
              />
            </div>
            <div className="col-span-12">
              <TotalLineChart splits={splits} />
            </div>
          </div>
        </div>
        <div className="col-span-6">
          <SplitsHistogram splits={splits.filter(split => split.quantity !== 0)} />
        </div>
      </div>
      <TransactionsTable
        splits={splits}
        accounts={accounts}
      />
    </>
  );
}
