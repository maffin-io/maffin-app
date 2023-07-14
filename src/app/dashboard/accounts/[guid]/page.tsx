'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { Account } from '@/book/entities';
import TransactionsTable from '@/components/TransactionsTable';
import AddTransactionButton from '@/components/AddTransactionButton';
import { getAccountsWithPath } from '@/book/queries';
import { useDataSource } from '@/hooks';

export type AccountPageProps = {
  params: {
    guid: string,
  },
};

export default function AccountPage({ params }: AccountPageProps): JSX.Element {
  const [datasource] = useDataSource();
  const [data, setData] = React.useState<{
    account: Account | undefined,
    accounts: Account[],
  }>({
    account: undefined,
    accounts: [],
  });
  const router = useRouter();

  React.useEffect(() => {
    async function load() {
      const accounts = await getAccountsWithPath();
      const account = accounts.find(a => a.guid === params.guid);

      if (!account) {
        router.push('/404');
      }

      setData({
        account,
        accounts,
      });
    }

    if (datasource) {
      load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasource, params.guid]);

  if (!data.account) {
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
          {data.account.path}
          {' '}
          account
        </span>
        <div className="col-span-2 col-end-13 justify-self-end">
          <AddTransactionButton account={data.account} />
        </div>
      </div>
      <TransactionsTable
        accountId={data.account.guid}
        accounts={data.accounts}
      />
    </>
  );
}
