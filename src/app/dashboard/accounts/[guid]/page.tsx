'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import useSWRImmutable from 'swr/immutable';

import { Split } from '@/book/entities';
import TransactionsTable from '@/components/TransactionsTable';
import AddTransactionButton from '@/components/AddTransactionButton';
import { getAccountsWithPath } from '@/book/queries';

export type AccountPageProps = {
  params: {
    guid: string,
  },
};

export default function AccountPage({ params }: AccountPageProps): JSX.Element {
  const { mutate } = useSWRConfig();
  let { data: accounts } = useSWRImmutable(
    '/api/accounts',
    getAccountsWithPath,
  );
  const { data: splits } = useSWRImmutable(
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

  return (
    <>
      <div className="grid grid-cols-12 items-center pb-4">
        <span className="col-span-10 text-xl font-medium">
          {account.path}
          {' '}
          account
        </span>
        <div className="col-span-2 col-end-13 justify-self-end">
          <AddTransactionButton
            account={account}
            onSave={() => mutate(`/api/splits/${params.guid}`)}
          />
        </div>
      </div>
      <TransactionsTable
        splits={splits || []}
        accounts={accounts}
      />
    </>
  );
}
