'use client';

import React from 'react';
import classNames from 'classnames';
import useSWRImmutable from 'swr/immutable';

import WeightsChart from '@/components/equities/WeightsChart';
import StatisticsWidget from '@/components/equities/StatisticsWidget';
import InvestmentsTable from '@/components/equities/InvestmentsTable';
import DividendChart from '@/components/equities/DividendChart';
import { toFixed } from '@/helpers/number';
import Money from '@/book/Money';
import { getInvestments, getMainCurrency } from '@/book/queries';

export default function InvestmentsPage(): JSX.Element {
  const { data: currency } = useSWRImmutable(
    '/api/main_currency',
    getMainCurrency,
  );
  const mainCurrency = currency?.mnemonic || 'EUR';
  let { data: investments } = useSWRImmutable(
    currency ? '/api/investments' : null,
    () => getInvestments(mainCurrency),
  );

  investments = investments || [];

  const totalValue = investments.reduce(
    (total, investment) => total.add(investment.valueInCurrency),
    new Money(0, mainCurrency),
  );
  const totalCost = investments.reduce(
    (total, investment) => total.add(investment.costInCurrency),
    new Money(0, mainCurrency),
  );

  const profitAbs = totalValue.subtract(totalCost);
  const profitPct = (profitAbs.toNumber() / totalCost.toNumber()) * 100;

  const totalDividends = investments.reduce(
    (total, investment) => total.add(investment.realizedDividendsInCurrency),
    new Money(0, mainCurrency),
  );
  const totalRealized = investments.reduce(
    (total, investment) => total.add(investment.realizedProfitInCurrency),
    new Money(0, mainCurrency),
  );

  const profitAbsWithDividends = profitAbs.add(totalDividends);
  const profitPctWithDividends = (
    profitAbsWithDividends.toNumber() / totalCost.toNumber()
  ) * 100;

  return (
    <>
      <span className="text-xl font-medium pb-4">
        Your Investments
      </span>

      <div className="grid grid-cols-12">
        <div className="col-span-4">
          <WeightsChart
            investments={investments}
            totalValue={totalValue}
          />
        </div>

        <div className="col-span-8">
          <div className="grid grid-cols-12">
            <div className="col-span-4">
              <StatisticsWidget
                title="Value/Cost"
                stats={`${totalValue.format()}`}
                description={
                  `${toFixed(totalCost.toNumber()).toString()} total invested`
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
            investments={investments}
          />
        </div>
      </div>

      <div className="py-4">
        <InvestmentsTable
          investments={investments.filter(
            investment => investment.quantity.toNumber() > 0,
          )}
        />
      </div>
    </>
  );
}
