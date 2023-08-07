import React from 'react';
import type { SWRResponse } from 'swr';
import { BiCalendar, BiUpArrowAlt, BiDownArrowAlt } from 'react-icons/bi';
import Link from 'next/link';
import classNames from 'classnames';

import { useApi } from '@/hooks';
import { isAsset } from '@/book/helpers/accountType';
import type { Split, Transaction } from '@/book/entities';
import { moneyToString } from '@/helpers/number';

export default function LatestTransactions(): JSX.Element {
  let { data: txs } = useApi('/api/txs/latest') as SWRResponse<Transaction[]>;
  txs = txs || [];
  return (
    <div>
      <p className="mb-4">Latest movements</p>
      {
        txs.map((tx, index) => {
          const assetSplit = getAssetSplit(tx);
          return (
            <div key={index} className="text-sm py-3">
              <span className="flex items-center">
                <div className="mr-2">
                  {
                    (assetSplit?.quantity || 0) > 0
                      ? <BiUpArrowAlt className="text-3xl text-green-300" />
                      : <BiDownArrowAlt className="text-3xl text-red-300" />
                  }
                </div>
                <div className="w-full">
                  <span className="inline-flex items-center">
                    <BiCalendar className="mr-1" />
                    {tx.date.toFormat('dd MMM')}
                    {' - '}
                    {tx.description}
                  </span>
                  <div className="flex items-center">
                    <span
                      className={classNames('', {
                        'text-green-300': (assetSplit?.quantity || 0) > 0,
                        'text-red-300': (assetSplit?.quantity || 0) < 0,
                      })}
                    >
                      {moneyToString(assetSplit?.quantity || 0, tx.currency.mnemonic)}
                    </span>
                    <Link
                      className="ml-auto text-xs badge hover:text-slate-300 bg-cyan-500/20 text-cyan-300"
                      href={`/dashboard/accounts/${assetSplit?.account?.guid}`}
                    >
                      {assetSplit?.account?.name || '???'}
                    </Link>
                  </div>
                </div>
              </span>
            </div>
          );
        })
      }
    </div>
  );
}

function getAssetSplit(tx: Transaction): Split | undefined {
  return tx.splits.find(split => isAsset(split.account));
}

function isExpense(tx: Transaction): boolean {
  return (tx.splits.find(split => split.account.type === 'EXPENSE') && true) || false;
}

function isIncome(tx: Transaction): boolean {
  return (tx.splits.find(split => split.account.type === 'INCOME') && true) || false;
}
