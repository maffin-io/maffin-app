'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import type { Account } from '@/book/entities';
import Money from '@/book/Money';
import { SplitsHistogram, TotalLineChart } from '@/components/pages/account';
import StatisticsWidget from '@/components/StatisticsWidget';
import { Split } from '@/book/entities';
import TransactionsTable from '@/components/TransactionsTable';
import TransactionFormButton from '@/components/buttons/TransactionFormButton';
import { useApi } from '@/hooks';

export type AccountPageProps = {
  params: {
    guid: string,
  },
};

export default function AccountPage({ params }: AccountPageProps): JSX.Element {
  let { data: accounts } = useApi('/api/accounts') as SWRResponse<Account[]>;
  let { data: splits } = useApi('/api/splits/<guid>', { guid: params.guid }) as SWRResponse<Split[]>;

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
  const total = account.getTotal();
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

  const split1 = new Split();
  split1.fk_account = account;

  const split2 = new Split();

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
          <TransactionFormButton
            defaultValues={
              {
                date: DateTime.now().toISODate() as string,
                description: '',
                splits: [split1, split2],
                fk_currency: account.commodity,
              }
            }
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
                title={`This year you ${totalKeyword}`}
                stats={new Money(totalThisYear, account.commodity.mnemonic).format()}
                description="in this account"
              />
            </div>
            <div className="col-span-12 bg-gunmetal-700 rounded-sm my-6 mr-6">
              <TotalLineChart splits={splits} />
            </div>
          </div>
        </div>
        <div className="col-span-6 bg-gunmetal-700 rounded-sm mb-6 p-4">
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
