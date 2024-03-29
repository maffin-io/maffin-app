import React from 'react';
import classNames from 'classnames';
import dynamic from 'next/dynamic';
import { BiTrendingDown, BiTrendingUp } from 'react-icons/bi';

import type { Account } from '@/book/entities';
import { useInvestment } from '@/hooks/api';
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

  if (!investment) {
    return <Loading />;
  }

  return (
    <div className="grid grid-cols-12 items-stretch">
      <div className="col-span-4">
        <div className="card text-lg">
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
            title="Closest price"
            statsTextClass={
              classNames(
                'table-caption badge default',
                { disabled: investment.isClosed },
              )
            }
            stats={new Money(investment.quoteInfo.price, investment.currency).format()}
            description={
              `on ${investment.quoteInfo.date.toLocaleString()}`
            }
          />
          <StatisticsWidget
            className="col-span-6"
            title="Value"
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
            className="col-span-6"
            statsTextClass={classNames({
              'amount-positive': investment.unrealizedProfitPct >= 0,
              'amount-negative': investment.unrealizedProfitPct < 0,
            })}
            title="Unrealized Profit"
            stats={
              `${toFixed(investment.unrealizedProfitPct)} %`
            }
            description={(
              <div className="flex items-center">
                {
                  investment.unrealizedProfitPct >= 0
                  && <BiTrendingUp className="mr-1 amount-positive" />
                }
                {
                  investment.unrealizedProfitPct < 0
                  && <BiTrendingDown className="mr-1 amount-negative" />
                }
                {investment.unrealizedProfitAbs.format()}
              </div>
            )}
          />
          <StatisticsWidget
            className="col-span-6"
            title="Realized Profit"
            stats={investment.realizedProfit.format()}
            statsTextClass={classNames({
              'amount-positive': investment.realizedProfitPct >= 0,
              'amount-negative': investment.realizedProfitPct < 0,
            })}
            description={`+ ${investment.realizedDividends.format()} from dividends`}
          />
        </div>
      </div>
      <div className="card col-span-8">
        <InvestmentChart account={account} />
      </div>
    </div>
  );
}
