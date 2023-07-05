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
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [account, setAccount] = React.useState<Account | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    async function load() {
      setAccounts(await getAccountsWithPath());
    }

    if (datasource) {
      load();
    }
  }, [datasource]);

  React.useEffect(() => {
    async function load() {
      const a = await Account.findOneBy({ guid: params.guid });
      if (a === null) {
        router.push('/404');
      } else {
        const accountWithPath = accounts.find(each => a.guid === each.guid);
        if (accountWithPath) {
          a.path = accountWithPath.path;
        }
        setAccount(a);
      }
    }

    if (datasource) {
      load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasource, params.guid, accounts]);

  if (account === null) {
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
          <AddTransactionButton account={account} />
        </div>
      </div>
      <TransactionsTable
        accountId={account.guid}
        accounts={accounts}
      />
    </>
  );
}
