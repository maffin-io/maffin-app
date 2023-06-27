'use client';

import React from 'react';
import classNames from 'classnames';

import useDataSource from '@/hooks/useDataSource';
import WeightsChart from '@/components/equities/WeightsChart';
import StatisticsWidget from '@/components/equities/StatisticsWidget';
import InvestmentsTable from '@/components/equities/InvestmentsTable';
import DividendChart from '@/components/equities/DividendChart';
import { toFixed } from '@/helpers/number';
import type { InvestmentAccount } from '@/book/models';
import Money from '@/book/Money';
import { getInvestments, getMainCurrency } from '@/book/queries';

export default function InvestmentsPage(): JSX.Element {
  const [dataSource] = useDataSource();
  const [data, setData] = React.useState<{
    investments: InvestmentAccount[],
    mainCurrency: string,
    stats: {
      totalValue: Money,
      totalCost: Money,
    },
  }>({
    investments: [],
    mainCurrency: 'EUR',
    stats: {
      totalValue: new Money(0, 'EUR'),
      totalCost: new Money(0, 'EUR'),
    },
  });

  const profitAbs = data.stats.totalValue.subtract(data.stats.totalCost);
  const profitPct = profitAbs.toNumber() / data.stats.totalCost.toNumber() * 100;

  const totalDividends = data.investments.reduce(
    (total, investment) => total.add(investment.realizedDividendsInCurrency),
    new Money(0, data.mainCurrency),
  );
  const totalRealized = data.investments.reduce(
    (total, investment) => total.add(investment.realizedProfitInCurrency),
    new Money(0, data.mainCurrency),
  );

  const profitAbsWithDividends = profitAbs.add(totalDividends);
  const profitPctWithDividends = profitAbsWithDividends.toNumber()
    / data.stats.totalCost.toNumber() * 100;

  React.useEffect(() => {
    async function load() {
      const mainCurrency = (await getMainCurrency()).mnemonic;
      const investments = await getInvestments(mainCurrency);

      const totalValue = investments.reduce(
        (total, investment) => total.add(investment.valueInCurrency),
        new Money(0, mainCurrency),
      );
      const totalCost = investments.reduce(
        (total, investment) => total.add(investment.costInCurrency),
        new Money(0, mainCurrency),
      );
      setData({
        investments,
        mainCurrency,
        stats: {
          totalValue,
          totalCost,
        },
      });
    }

    if (dataSource) {
      load();
    }
  }, [dataSource]);

  return (
    <>
      <span className="text-xl font-medium pb-4">
        Your Investments
      </span>

      <div className="grid grid-cols-12">
        <div className="col-span-4">
          <WeightsChart
            investments={data.investments}
            totalValue={data.stats.totalValue}
          />
        </div>

        <div className="col-span-8">
          <div className="grid grid-cols-12">
            <div className="col-span-4">
              <StatisticsWidget
                title="Value/Cost"
                stats={`${data.stats.totalValue.format()}`}
                description={
                  `${toFixed(data.stats.totalCost.toNumber()).toString()} total invested`
                }
              />
            </div>

            <div className="col-span-4">
              <StatisticsWidget
                statsTextClass={classNames({
                  'text-green-500': profitPct >= 0,
                  'text-red-400': profitPct < 0,
                })}
                title="Unrealized Profit"
                stats={`${profitAbs.format()} (${toFixed(profitPct)}%)`}
                description={
                  `${toFixed(profitAbsWithDividends.toNumber())} (${toFixed(profitPctWithDividends)}%) with dividends`
                }
              />
            </div>

            <div className="col-span-4">
              <StatisticsWidget
                statsTextClass={classNames('mdi', {
                  'text-green-500': totalRealized.add(totalDividends).toNumber() >= 0,
                  'text-red-400': totalRealized.add(totalDividends).toNumber() < 0,
                })}
                title="Realized"
                stats={totalRealized.add(totalDividends).format()}
                description={
                  `${totalDividends.format()} from dividends`
                }
              />
            </div>
          </div>
          <DividendChart
            investments={data.investments}
          />
        </div>
      </div>

      <div className="py-4">
        <InvestmentsTable
          investments={data.investments.filter(
            investment => investment.quantity.toNumber() > 0,
          )}
        />
      </div>
    </>
  );
}
