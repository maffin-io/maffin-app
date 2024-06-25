import React from 'react';
import classNames from 'classnames';

import {
  WeightsChart,
  DividendChart,
} from '@/components/charts';
import { InvestmentsTable } from '@/components/tables';
import StatisticsWidget from '@/components/StatisticsWidget';
import { toFixed } from '@/helpers/number';
import Loading from '@/components/Loading';
import Money from '@/book/Money';
import { useMainCurrency, useInvestments } from '@/hooks/api';
import type { Account } from '@/book/entities';

export type InvestmentPlaceholderInfoProps = {
  account: Account;
};

export default function InvestmentPlaceholderInfo({
  account,
}: InvestmentPlaceholderInfoProps): JSX.Element {
  const { data: investments = [], isPending } = useInvestments(
    data => data.filter(d => d.account.path.startsWith(account.path)),
  );
  const accounts = investments.map(i => i.account.guid);

  const { data: currency } = useMainCurrency();
  const mainCurrency = currency?.mnemonic || 'EUR';

  if (isPending) {
    return (
      <div className="h-screen">
        <div className="flex text-sm h-3/4 place-content-center place-items-center">
          <Loading />
        </div>
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="h-screen">
        <div className="flex text-sm h-3/4 place-content-center place-items-center">
          You have no investments yet!
        </div>
      </div>
    );
  }

  const totalValue = investments.reduce(
    (total, investment) => total.add(investment.valueInCurrency),
    new Money(0, mainCurrency),
  );
  const totalCost = investments.reduce(
    (total, investment) => total.add(investment.costInCurrency),
    new Money(0, mainCurrency),
  );

  const unrealizedProfitAbs = totalValue.subtract(totalCost);
  const unrealizedProfitPct = (unrealizedProfitAbs.toNumber() / totalCost.toNumber()) * 100;

  const totalDividends = investments.reduce(
    (total, investment) => total.add(investment.realizedDividendsInCurrency),
    new Money(0, mainCurrency),
  );
  const totalRealized = investments.reduce(
    (total, investment) => total.add(investment.realizedProfitInCurrency),
    new Money(0, mainCurrency),
  );

  const unrealizedProfitAbsWithDividends = unrealizedProfitAbs.add(totalDividends);
  const unrealizedProfitPctWithDividends = (
    unrealizedProfitAbsWithDividends.toNumber() / totalCost.toNumber()
  ) * 100;

  return (
    <>
      <div className="grid md:grid-cols-12 auto-cols-fr mt-4">
        <div className="md:col-span-4 mt-2">
          <WeightsChart accounts={accounts} totalValue={totalValue} />
        </div>

        <div className="md:col-span-8">
          <div className="grid md:grid-cols-12 auto-cols-fr">
            <div className="md:col-span-4">
              <StatisticsWidget
                title="Value/Cost"
                stats={totalValue.format()}
                description={
                  `${totalCost.format()} total invested`
                }
              />
            </div>

            <div className="md:col-span-4">
              <StatisticsWidget
                statsTextClass={classNames({
                  'text-success': unrealizedProfitPct >= 0,
                  'text-danger': unrealizedProfitPct < 0,
                })}
                title="Unrealized Profit"
                stats={`${unrealizedProfitAbs.format()} (${toFixed(unrealizedProfitPct)}%)`}
                description={
                  `${unrealizedProfitAbsWithDividends.format()} (${toFixed(unrealizedProfitPctWithDividends)}%) with dividends`
                }
              />
            </div>

            <div className="md:col-span-4">
              <StatisticsWidget
                statsTextClass={classNames({
                  'text-success': totalRealized.add(totalDividends).toNumber() >= 0,
                  'text-danger': totalRealized.add(totalDividends).toNumber() < 0,
                })}
                title="Realized"
                stats={totalRealized.add(totalDividends).format()}
                description={
                  `${totalDividends.format()} from dividends`
                }
              />
            </div>
          </div>
          <div className="card">
            <DividendChart accounts={accounts} />
          </div>
        </div>
      </div>

      <div className="py-4">
        <InvestmentsTable accounts={accounts} />
      </div>
    </>
  );
}
