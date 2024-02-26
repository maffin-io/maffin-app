import React from 'react';
import classNames from 'classnames';
import dynamic from 'next/dynamic';

import type { Account } from '@/book/entities';
import { useInvestment, usePrices } from '@/hooks/api';
import Loading from '@/components/Loading';
import StatisticsWidget from '@/components/StatisticsWidget';
import { toFixed } from '@/helpers/number';
import Money from '@/book/Money';

const InvestmentChart = dynamic(() => import('./InvestmentChart'), { ssr: false });

export type InvestmentInfoProps = {
  account: Account,
};

export default function InvestmentInfo({
  account,
}: InvestmentInfoProps): JSX.Element {
  const { data: investment } = useInvestment(account.guid);
  let { data: prices } = usePrices({ from: account.commodity });

  if (!investment || !prices) {
    return <Loading />;
  }

  prices = prices || [];
  const latestPrice = prices.getInvestmentPrice(investment.account.commodity.mnemonic);

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-4">
        <div className="card text-lg">
          <span>You currently owe</span>
          <span
            className={
              classNames(
                'badge default text-xl font-semibold mx-1',
                { disabled: investment.isClosed },
              )
            }
          >
            {`${investment.quantity.toNumber()} titles`}
          </span>
          <span>at an average price of</span>
          <span
            className={
              classNames(
                'badge default text-xl font-semibold mx-1',
                { disabled: investment.isClosed },
              )
            }
          >
            {
              new Money(
                investment.isClosed ? 0 : investment.avgPrice,
                investment.currency,
              ).format()
            }
          </span>
        </div>
        <div className="grid grid-cols-12">
          <StatisticsWidget
            className="col-span-6"
            title="Latest known price"
            statsTextClass={
              classNames(
                'table-caption badge default',
                { disabled: investment.isClosed },
              )
            }
            stats={new Money(latestPrice.value, investment.currency).format()}
            description={
              `on ${latestPrice.date.toLocaleString()}`
            }
          />
          <StatisticsWidget
            className="col-span-6"
            title="Current value is"
            stats={`${investment.value.format()}`}
            statsTextClass={classNames({
              'amount-positive': investment.unrealizedProfitPct >= 0,
              'amount-negative': investment.unrealizedProfitPct < 0,
            })}
            description={
              `from ${investment.cost.format()} invested`
            }
          />
          <StatisticsWidget
            className="col-span-7"
            statsTextClass={classNames({
              'amount-positive': investment.isClosed
                ? investment.realizedProfitPct >= 0
                : investment.unrealizedProfitPct >= 0,
              'amount-negative': investment.isClosed
                ? investment.realizedProfitPct < 0
                : investment.unrealizedProfitPct < 0,
            })}
            title={investment.isClosed ? 'Realized Profit' : 'Unrealized Profit'}
            stats={
              investment.isClosed
                ? `${investment.realizedProfit.format()} (${toFixed(investment.realizedProfitPct)}%)`
                : `${investment.unrealizedProfitAbs.format()} (${toFixed(investment.unrealizedProfitPct)}%)`
            }
            description={
              investment.isClosed
                ? `Bought a total of ${investment.totalBought.format()}`
                : ''
            }
          />
          <StatisticsWidget
            className="col-span-5"
            title="Total Dividends"
            stats={investment.realizedDividends.format()}
            statsTextClass={classNames('badge default', { disabled: investment.isClosed })}
            description=""
          />
        </div>
      </div>
      <div className="card col-span-8">
        <InvestmentChart account={account} />
      </div>
    </div>
  );
}
