import React from 'react';

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
  const yearData = buildSeries(investments);
  const lastYearMonthlySeries = buildMonthlySeries(yearData[yearData.length - 1]);

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
              series={[{ data: yearData, name: 'dividends' }]}
              showLegend={false}
              unit={currencyToSymbol(currency)}
              plotOptions={
                {
                  bar: {
                    horizontal: true,
                    barHeight: '55%',
                  },
                }
              }
              events={
                {
                  dataPointSelection: (e, chart) => {
                    const seriesIndex = 0;

                    const selectedPoint = chart.w.globals.selectedDataPoints[0][0];
                    if (selectedPoint === undefined) {
                      return [];
                    }
                    const selected = chart.w.config.series[seriesIndex].data[selectedPoint] as {
                      x: string,
                      y: number,
                      dividends: { [month: string]: { amount: number, ticker: string }[] },
                    };

                    return ApexCharts.exec('barMonthly', 'updateOptions', {
                      series: buildMonthlySeries(selected),
                    });
                  },
                }
              }
            />
          </div>
        </div>
        <div className="col-span-8">
          <div id="chart-monthly">
            <Chart
              id="barMonthly"
              type="bar"
              series={lastYearMonthlySeries}
              unit={currencyToSymbol(currency)}
              xCategories={Object.values(MONTHS)}
              stacked
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const MONTHS: { [key:number]: string; } = {
  0: 'Jan',
  1: 'Feb',
  2: 'Mar',
  3: 'Apr',
  4: 'May',
  5: 'Jun',
  6: 'Jul',
  7: 'Aug',
  8: 'Sep',
  9: 'Oct',
  10: 'Nov',
  11: 'Dec',
};

function buildSeries(investments: InvestmentAccount[]) {
  const perYear: {
    [year: number]: {
      [month: string]: {
        amount: number,
        ticker: string,
      }[],
    },
  } = {};
  investments.forEach(investment => {
    investment.dividends.forEach(dividend => {
      const month = MONTHS[dividend.when.month - 1];
      const { year } = dividend.when;

      if (!(year in perYear)) {
        perYear[year] = {};
      }

      const amount = dividend.amountInCurrency.toNumber();

      if (!(month in perYear[year])) {
        perYear[year][month] = [{
          amount,
          ticker: investment.account.name,
        }];
      } else {
        perYear[year][month].push({
          amount,
          ticker: investment.account.name,
        });
      }
    });
  });

  const series: {
    x: string,
    y: number,
    dividends: { [month: string]: { amount: number, ticker: string }[] },
  }[] = [];
  Object.entries(perYear).forEach(([year, perMonth]) => {
    let yearTotal = 0;
    Object.values(perMonth).forEach(monthlyDividend => {
      monthlyDividend.forEach(dividend => {
        yearTotal += dividend.amount;
      });
    });

    const yearData = {
      x: year,
      y: yearTotal,
      dividends: perMonth,
    };
    series.push(yearData);
  });

  return series;
}

function buildMonthlySeries(
  selectedSeries: {
    x: string,
    y: number,
    dividends: { [month: string]: { amount: number, ticker: string }[] },
  },
) {
  const tickerSeries: { [ticker: string]: number[] } = {};

  Object.entries(MONTHS).forEach(([monthNumber, month]) => {
    if (month in selectedSeries.dividends) {
      selectedSeries.dividends[month].forEach(dividend => {
        if (!(dividend.ticker in tickerSeries)) {
          tickerSeries[dividend.ticker] = new Array(12).fill(0);
        }
        tickerSeries[dividend.ticker][Number(monthNumber)] += dividend.amount;
      });
    }
  });

  const series: { name: string, data: number[] }[] = [];
  Object.entries(tickerSeries).forEach(([ticker, monthlyDividends]) => {
    series.push({
      name: ticker,
      data: monthlyDividends,
    });
  });

  return series;
}
