import React from 'react';
import dynamic from 'next/dynamic';

import { toFixed } from '@/helpers/number';
import type { InvestmentAccount } from '@/book/models';
import { currencyToSymbol } from '@/book/helpers';

// apexcharts import references window so we need this
// https://stackoverflow.com/questions/68596778
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MONTHS: { [key:number]:string; } = {
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
  const series = buildSeries(investments);

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
            {
              (typeof window !== 'undefined')
              // @ts-ignore
              && <Chart options={OPTIONS_YEARLY} series={[{ data: series }]} type="bar" width="100%" height={400} />
            }
          </div>
        </div>
        <div className="col-span-8">
          <div id="chart-monthly">
            {
              (typeof window !== 'undefined')
              && (
                // @ts-ignore
                <Chart
                  options={OPTIONS_MONTHLY}
                  series={[]}
                  type="bar"
                  className="apex-charts"
                  // https://stackoverflow.com/questions/75103994
                  width="100%"
                  height={400}
                />
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function buildSeries(investments: InvestmentAccount[]) {
  const perYear: {
    [year:string]: {
      [month:string]: {
        amount: number,
        ticker: string,
      },
    },
  } = {};
  investments.forEach(investment => {
    investment.dividends.forEach(dividend => {
      const month = MONTHS[dividend.when.month - 1];
      const year = dividend.when.year.toString();

      if (!(year in perYear)) {
        perYear[year] = {};
      }

      const amount = dividend.amountInCurrency.toNumber();

      if (!(month in perYear[year])) {
        // @ts-ignore
        perYear[year][month] = [{
          amount,
          ticker: investment.account.name,
        }];
      } else {
        // @ts-ignore
        perYear[year][month].push({
          amount,
          ticker: investment.account.name,
        });
      }
    });
  });

  // @ts-ignore
  const series = [];
  Object.entries(perYear).forEach(([year, perMonth]) => {
    let yearTotal = 0;
    Object.values(perMonth).forEach(monthlyDividend => {
      // @ts-ignore
      monthlyDividend.forEach(dividend => {
        yearTotal += dividend.amount;
      });
    });

    const yearSeries = {
      x: year,
      y: yearTotal,
      dividends: perMonth,
    };
    series.push(yearSeries);
  });

  // @ts-ignore
  return series;
}

// @ts-ignore
function updateMonthlyChart(yearlyChart, destChartIDToUpdate) {
  const seriesIndex = 0;

  const selectedPoint = yearlyChart.w.globals.selectedDataPoints[0][0];
  if (selectedPoint === undefined) {
    return [];
  }
  const selectedSeries = yearlyChart.w.config.series[seriesIndex].data[selectedPoint];

  const tickerSeries = {};

  Object.entries(MONTHS).forEach(([monthNumber, month]) => {
    if (month in selectedSeries.dividends) {
      // @ts-ignore
      selectedSeries.dividends[month].forEach(dividend => {
        if (!(dividend.ticker in tickerSeries)) {
          // @ts-ignore
          tickerSeries[dividend.ticker] = new Array(12).fill(0);
        }
        // @ts-ignore
        tickerSeries[dividend.ticker][monthNumber] = dividend.amount;
      });
    }
  });

  // @ts-ignore
  const series = [];
  Object.entries(tickerSeries).forEach(([ticker, monthlyDividends]) => {
    series.push({
      name: ticker,
      data: monthlyDividends,
    });
  });

  return ApexCharts.exec(destChartIDToUpdate, 'updateOptions', {
    // @ts-ignore
    series,
  });
}

const OPTIONS_YEARLY = {
  grid: {
    show: false,
  },
  chart: {
    id: 'barYear',
    width: '100%',
    foreColor: '#94A3B8',
    events: {
      // @ts-ignore
      dataPointSelection: (e, chart) => {
        updateMonthlyChart(chart, 'barMonthly');
      },
      // @ts-ignore
      mounted: (chart) => {
        const seriesIndex = 0;
        if (chart.w.globals.selectedDataPoints.length === 0) {
          // Display the last year by default
          chart.toggleDataPointSelection(
            seriesIndex,
            chart.w.config.series[seriesIndex].data.length - 1,
          );
        }

        updateMonthlyChart(chart, 'barMonthly');
      },
    },
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '55%',
    },
  },
  dataLabels: {
    enabled: false,
  },
  states: {
    active: {
      allowMultipleDataPointsSelection: false,
      filter: {
        type: 'lighten',
        value: 0.5,
      },
    },
  },
  tooltip: {
    fillSeriesColor: true,
    y: {
      title: {
        formatter: () => '',
      },
      formatter: (val: number) => `${toFixed(val)}`,
    },
    x: {
      show: false,
    },
    theme: 'dark',
  },
  yaxis: {
    labels: {
      show: true,
    },
  },
  legend: {
    show: false,
  },
};

const OPTIONS_MONTHLY = {
  grid: {
    borderColor: '#777f85',
  },
  chart: {
    id: 'barMonthly',
    width: '100%',
    stacked: true,
    foreColor: '#94A3B8',
    toolbar: {
      show: false,
    },
  },
  yaxis: [
    {
      labels: {
        formatter: (val: number) => `${toFixed(val)}`,
      },
    },
  ],
  xaxis: {
    categories: Object.values(MONTHS),
    axisBorder: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      endingShape: 'rounded',
    },
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    fillSeriesColor: true,
    y: {
      formatter: (val: number) => `${toFixed(val)}`,
    },
    x: {
      show: false,
    },
    theme: 'dark',
    intersect: true,
    inverseOrder: true,
    shared: false,
  },
  legend: {
    show: true,
  },
};
