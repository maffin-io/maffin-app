import React from 'react';
import classNames from 'classnames';

import type { Account } from '@/book/entities';
import { useInvestment, usePrices } from '@/hooks/api';
import Loading from '@/components/Loading';
import StatisticsWidget from '@/components/StatisticsWidget';
import { toFixed } from '@/helpers/number';
import Money from '@/book/Money';
import InvestmentChart from './InvestmentChart';

export type InvestmentInfoProps = {
  account: Account,
};

export default function InvestmentInfo({
  account,
}: InvestmentInfoProps): JSX.Element {
  const { data: investment } = useInvestment(account.guid);
  let { data: prices } = usePrices(account.commodity.guid);

  if (!investment || !prices) {
    return <Loading />;
  }

  prices = prices || [];
  const latestPrice = prices[prices.length - 1];

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-4">
        <div className="card text-lg">
          <span>You currently owe</span>
          <span className="badge text-xl font-semibold mx-1">{`${investment.quantity.toNumber()} titles`}</span>
          <span>at an average price of</span>
          <span className="badge text-xl font-semibold mx-1">{new Money(investment.avgPrice, investment.currency).format()}</span>
        </div>
        <div className="grid grid-cols-12">
          <StatisticsWidget
            className="col-span-6"
            title="Latest known price"
            statsTextClass="table-caption badge"
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
              'amount-positive': investment.profitPct >= 0,
              'amount-negative': investment.profitPct < 0,
            })}
            description={
              `from ${investment.cost.format()} invested`
            }
          />
          <StatisticsWidget
            className="col-span-7"
            statsTextClass={classNames({
              'amount-positive': investment.profitPct >= 0,
              'amount-negative': investment.profitPct < 0,
            })}
            title="Unrealized Profit"
            stats={`${investment.profitAbs.format()} (${toFixed(investment.profitPct)}%)`}
            description=""
          />
          <StatisticsWidget
            className="col-span-5"
            title="Total Dividends"
            stats={investment.realizedDividends.format()}
            statsTextClass="badge"
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
