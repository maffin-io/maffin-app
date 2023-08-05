import React from 'react';
import { Interval, DateTime, Info } from 'luxon';

import Money from '@/book/Money';
import type { InvestmentAccount } from '@/book/models';
import { currencyToSymbol } from '@/book/helpers';
import Chart from '@/components/charts/Chart';

export type DividendChartProps = {
  investments: InvestmentAccount[],
};

export default function DividendChart({
  investments,
}: DividendChartProps): JSX.Element {
  if (!investments.length) {
    return (
      <span>Loading...</span>
    );
  }

  const currency = investments[0].mainCurrency;
  const yearSeries = buildSeries(investments);
  const lastYearMonthlySeries = buildMonthlySeries(
    yearSeries[0].data[yearSeries[0].data.length - 1],
  );

  return (
    <div className="bg-gunmetal-700 rounded-sm m-6 p-4">
      <span className="text-lg">
        {`
          Dividends in
          ${currencyToSymbol(currency)}
        `}
      </span>

      <div className="grid grid-cols-12">
        <div className="col-span-4">
          <div id="chart-year" className="text-slate-300">
            <Chart
              type="bar"
              series={yearSeries}
              unit={currency}
              options={{
                legend: {
                  show: false,
                },
                plotOptions: {
                  bar: {
                    horizontal: true,
                    barHeight: '55%',
                  },
                },
                chart: {
                  events: {
                    dataPointSelection: (e, chart) => {
                      const seriesIndex = 0;

                      const selectedPoint = chart.w.globals.selectedDataPoints[0][0];
                      if (selectedPoint === undefined) {
                        return [];
                      }
                      const selected = chart.w.config.series[seriesIndex].data[selectedPoint] as {
                        x: string,
                        y: number,
                        dividends: { ticker: string, amount: number }[][],
                      };

                      return ApexCharts.exec('barMonthly', 'updateOptions', {
                        series: buildMonthlySeries(selected),
                      });
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="col-span-8">
          <div id="chart-monthly">
            <Chart
              type="bar"
              series={lastYearMonthlySeries}
              unit={currency}
              options={{
                chart: {
                  id: 'barMonthly',
                  stacked: true,
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function buildSeries(investments: InvestmentAccount[]) {
  const series: {
    name: string,
    data: {
      x: string,
      y: number,
      dividends: { ticker: string, amount: number }[][],
    }[],
  }[] = [
    {
      name: 'Total dividends',
      data: [],
    },
  ];

  const allDividends: {
    ticker: string,
    when: DateTime,
    amountInCurrency: Money,
  }[] = [];
  investments.forEach(investment => {
    investment.dividends.forEach(dividend => {
      allDividends.push({
        ticker: investment.account.name,
        ...dividend,
      });
    });
  });

  const startDate = Math.min(...(allDividends.map(dividend => dividend.when.toMillis())));
  const endDate = Math.max(...(allDividends.map(dividend => dividend.when.toMillis())));
  const interval = Interval.fromDateTimes(
    DateTime.fromMillis(startDate),
    DateTime.fromMillis(endDate),
  );
  const years = interval.splitBy({ year: 1 }).map(d => (d.start as DateTime).year);
  const currentYear = DateTime.now().year;
  if (!years.includes(currentYear)) {
    years.push(DateTime.now().year);
  }

  series[0].data = years.map(y => ({
    x: y.toString(),
    y: 0,
    dividends: Array.from(Array(12), () => []),
  }));

  allDividends.forEach(dividend => {
    const yearData = series[0].data[years.indexOf(dividend.when.year)];
    yearData.y += dividend.amountInCurrency.toNumber();
    yearData.dividends[dividend.when.month - 1].push(
      { ticker: dividend.ticker, amount: dividend.amountInCurrency.toNumber() },
    );
  });

  return series;
}

function buildMonthlySeries(
  selectedSeries: {
    x: string,
    y: number,
    dividends: { ticker: string, amount: number }[][],
  },
) {
  const series: { name: string, data: { x: string, y: number }[] }[] = [];
  const tickers = new Set(selectedSeries.dividends.flat().map(d => d.ticker));

  tickers.forEach(ticker => {
    series.push({
      name: ticker,
      data: selectedSeries.dividends.map((monthDividends, index) => ({
        x: Info.months('short')[index],
        y: monthDividends.filter(
          dividend => dividend.ticker === ticker,
        ).reduce(
          (total, dividend) => total + dividend.amount,
          0,
        ),
      })),
    });
  });

  return series;
}
