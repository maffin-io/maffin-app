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
  const { data: investments, isPending } = useInvestments(
    data => data.filter(d => account.childrenIds.includes(d.account.guid)),
  );

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

  if (!investments || investments.length === 0) {
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
      <div className="grid grid-cols-12 mt-4">
        <div className="col-span-4 mt-2">
          <WeightsChart accounts={account.childrenIds} totalValue={totalValue} />
        </div>

        <div className="col-span-8 ml-4">
          <div className="grid grid-cols-12">
            <div className="col-span-4">
              <StatisticsWidget
                className="mr-2"
                title="Value/Cost"
                stats={totalValue.format()}
                description={
                  `${totalCost.format()} total invested`
                }
              />
            </div>

            <div className="col-span-4">
              <StatisticsWidget
                className="mr-2"
                statsTextClass={classNames({
                  'amount-positive': unrealizedProfitPct >= 0,
                  'amount-negative': unrealizedProfitPct < 0,
                })}
                title="Unrealized Profit"
                stats={`${unrealizedProfitAbs.format()} (${toFixed(unrealizedProfitPct)}%)`}
                description={
                  `${unrealizedProfitAbsWithDividends.format()} (${toFixed(unrealizedProfitPctWithDividends)}%) with dividends`
                }
              />
            </div>

            <div className="col-span-4">
              <StatisticsWidget
                className="mr-2"
                statsTextClass={classNames({
                  'amount-positive': totalRealized.add(totalDividends).toNumber() >= 0,
                  'amount-negative': totalRealized.add(totalDividends).toNumber() < 0,
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
            <DividendChart accounts={account.childrenIds} />
          </div>
        </div>
      </div>

      <div className="py-4">
        <InvestmentsTable accounts={account.childrenIds} />
      </div>
    </>
  );
}
