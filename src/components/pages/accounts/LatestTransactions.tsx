import React from 'react';
import { BiCalendar, BiUpArrowAlt, BiDownArrowAlt } from 'react-icons/bi';
import Link from 'next/link';
import classNames from 'classnames';

import { useLatestTxs } from '@/hooks/api';
import { isAsset } from '@/book/helpers/accountType';
import type { Split, Transaction } from '@/book/entities';
import { moneyToString } from '@/helpers/number';

export default function LatestTransactions(): JSX.Element {
  let { data: txs } = useLatestTxs();
  txs = txs || [];
  const title = txs.length ? 'Latest movements' : 'You have no movements yet...';

  return (
    <div>
      <p className="mb-4">{title}</p>
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
