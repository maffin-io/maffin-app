import React from 'react';
import {
  BiCalendar,
  BiUpArrowAlt,
  BiDownArrowAlt,
} from 'react-icons/bi';
import Link from 'next/link';
import classNames from 'classnames';

import { useLatestTxs } from '@/hooks/api';
import { isAsset, isInvestment, isLiability } from '@/book/helpers/accountType';
import type { Split, Transaction } from '@/book/entities';
import { moneyToString } from '@/helpers/number';

export default function LatestTransactions(): JSX.Element {
  let { data: txs } = useLatestTxs();
  txs = txs || [];

  return (
    <div>
      <p>
        Latest transactions
      </p>
      {
        (
          txs.length
          && txs.map((tx, index) => {
            const selectedSplit = getAssetSplit(tx) || getLiabilitySplit(tx);
            return (
              <div key={index} className="text-sm py-3">
                <span className="flex items-center">
                  <div className="mr-2">
                    {
                      (selectedSplit?.quantity || 0) > 0
                        ? <BiUpArrowAlt className="text-xl amount-positive" />
                        : <BiDownArrowAlt className="text-xl amount-negative" />
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
                          'amount-positive': (selectedSplit?.quantity || 0) > 0,
                          'amount-negative': (selectedSplit?.quantity || 0) < 0,
                        })}
                      >
                        {moneyToString(
                          selectedSplit?.quantity || 0,
                          selectedSplit?.account.commodity.mnemonic || '',
                        )}
                      </span>
                      <Link
                        className={classNames('ml-auto text-xs badge hover:text-slate-300', {
                          info: selectedSplit?.account && isAsset(selectedSplit.account),
                          warning: selectedSplit?.account && isLiability(selectedSplit?.account),
                        })}
                        href={`/dashboard/accounts/${selectedSplit?.account?.guid}`}
                      >
                        {selectedSplit?.account?.name || '???'}
                      </Link>
                    </div>
                  </div>
                </span>
              </div>
            );
          })
        )
      }
    </div>
  );
}

function getAssetSplit(tx: Transaction): Split | undefined {
  return tx.splits.find(split => isAsset(split.account) && !isInvestment(split.account));
}

function getLiabilitySplit(tx: Transaction): Split | undefined {
  return tx.splits.find(split => isLiability(split.account));
}
