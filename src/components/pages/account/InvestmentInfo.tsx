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
}: InvestmentInfoProps): React.JSX.Element {
  const { data: investment } = useInvestment(account.guid);

  if (!investment) {
    return <Loading />;
  }

  return (
    <div className="grid md:grid-cols-12 auto-cols-fr items-stretch">
      <div className="md:col-span-4">
        {
          (
            investment.account.commodity.namespace !== 'CURRENCY'
            && (
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
            )
          ) || (
            <div className="card text-lg">
              <span
                className={
                  classNames(
                    'badge default text-xl font-semibold mx-1',
                    { disabled: investment.isClosed },
                  )
                }
              >
                {`${investment.value.format()}`}
              </span>
              <span>from a total investment of</span>
              <span
                className={
                  classNames(
                    'badge default text-xl font-semibold mx-1',
                    { disabled: investment.isClosed },
                  )
                }
              >
                {investment.cost.format()}
              </span>
            </div>
          )
        }
        <div className="grid grid-cols-12">
          {
            investment.account.commodity.namespace !== 'CURRENCY'
            && (
              <>
                <StatisticsWidget
                  className="col-span-6"
                  title="Value"
                  stats={`${investment.value.format()}`}
                  statsTextClass={classNames({
                    'text-success': investment.unrealizedProfitPct >= 0,
                    'text-danger': investment.unrealizedProfitPct < 0,
                  })}
                  description={
                    `from ${investment.cost.format()} invested`
                  }
                />
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
              </>
            )
          }
          <StatisticsWidget
            className="col-span-6"
            statsTextClass={classNames({
              'text-success': investment.unrealizedProfitPct >= 0,
              'text-danger': investment.unrealizedProfitPct < 0,
            })}
            title="Unrealized Profit"
            stats={
              `${toFixed(investment.unrealizedProfitPct)} %`
            }
            description={(
              <div className="flex items-center">
                {
                  investment.unrealizedProfitPct >= 0
                  && <BiTrendingUp className="mr-1 text-success" />
                }
                {
                  investment.unrealizedProfitPct < 0
                  && <BiTrendingDown className="mr-1 text-danger" />
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
              'text-success': investment.realizedProfitPct >= 0,
              'text-danger': investment.realizedProfitPct < 0,
            })}
            description={`+ ${investment.realizedDividends.format()} from dividends`}
          />
        </div>
      </div>
      <div className="card md:col-span-8">
        <InvestmentChart account={account} />
      </div>
    </div>
  );
}
