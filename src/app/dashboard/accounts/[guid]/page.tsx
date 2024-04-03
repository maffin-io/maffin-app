'use client';

import React from 'react';

import {
  Header,
  InvestmentInfo,
  AssetInfo,
  IEInfo,
  InvestmentPlaceholderInfo,
} from '@/components/pages/account';
import { TransactionsTable } from '@/components/tables';
import { useAccount } from '@/hooks/api';
import Loading from '@/components/Loading';
import { isAsset, isLiability, isInvestment } from '@/book/helpers';

export type AccountPageProps = {
  params: {
    guid: string,
  },
};

export default function AccountPage({ params }: AccountPageProps): JSX.Element {
  const { data: account, isLoading } = useAccount(params.guid);

  if (isLoading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex h-screen text-sm place-content-center place-items-center">
        {`Account ${params.guid} does not exist`}
      </div>
    );
  }

  let infoComponent: JSX.Element;
  if (isInvestment(account) && account.placeholder) {
    infoComponent = <InvestmentPlaceholderInfo account={account} />;
  } else if (isInvestment(account)) {
    infoComponent = <InvestmentInfo account={account} />;
  } else if (isAsset(account) || isLiability(account)) {
    infoComponent = <AssetInfo account={account} />;
  } else {
    infoComponent = <IEInfo account={account} />;
  }

  return (
    <>
      <Header account={account} />
      {infoComponent}
      {
        !account.placeholder
        && (
          <div className="card p-0 mt-4 bg-light-100 dark:bg-dark-800">
            <TransactionsTable account={account} />
          </div>
        )
      }
    </>
  );
}
