import React from 'react';
import { Interval, DateTime } from 'luxon';
import type { ChartData } from 'chart.js';

import Money from '@/book/Money';
import Bar from '@/components/charts/Bar';
import * as API from '@/hooks/api';
import { moneyToString } from '@/helpers/number';
import type { InvestmentAccount } from '@/book/models';

export default function DividendChart(): JSX.Element {
  const [selectedYear, setSelectedYear] = React.useState(DateTime.now().year);
  let { data: investments } = API.useInvestments();
  investments = investments || [];

  const { data: currency } = API.useMainCurrency();
  const unit = currency?.mnemonic || '';

  const [yearData, monthlyData] = buildData(investments, selectedYear);

  return (
    <div>
      <span className="text-lg">
        Dividends
      </span>

      <div className="grid grid-cols-12">
        <div className="col-span-4">
          <div id="chart-year">
            <Bar
              height="400"
              data={yearData}
              options={{
                onClick: (_, elements, chart) => {
                  if (elements.length) {
                    setSelectedYear(
                      (chart.data.labels?.[elements[0].index]) as number,
                    );
                  }
                },
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  datalabels: {
                    display: false,
                  },
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    displayColors: false,
                    backgroundColor: (
                      tooltipItem,
                    ) => tooltipItem.tooltip.labelColors[0].backgroundColor,
                    callbacks: {
                      title: () => '',
                      label: (ctx) => `${moneyToString(Number(ctx.raw), unit)}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: {
                      drawOnChartArea: false,
                    },
                    border: {
                      display: false,
                    },
                  },
                  y: {
                    border: {
                      display: false,
                    },
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="col-span-8">
          <div id="chart-year">
            <Bar
              height="400"
              data={monthlyData}
              options={{
                maintainAspectRatio: false,
                hover: {
                  mode: 'dataset',
                  intersect: true,
                },
                scales: {
                  x: {
                    stacked: true,
                    grid: {
                      display: false,
                    },
                  },
                  y: {
                    border: {
                      display: false,
                    },
                    stacked: true,
                    ticks: {
                      maxTicksLimit: 5,
                      callback: (value) => moneyToString(value as number, unit),
                    },
                  },
                },
                plugins: {
                  datalabels: {
                    display: false,
                  },
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                    },
                  },
                  tooltip: {
                    displayColors: false,
                    backgroundColor: (
                      tooltipItem,
                    ) => tooltipItem.tooltip.labelColors[0].backgroundColor,
                    callbacks: {
                      title: () => '',
                      label: (ctx) => `${ctx.dataset.label}: ${moneyToString(Number(ctx.raw), unit)}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function buildData(
  investments: InvestmentAccount[],
  selectedYear: number,
): [ChartData<'bar'>, ChartData<'bar'>] {
  const yearData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        hoverBackgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
    ],
  };

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

  let startDate = DateTime.now();
  let endDate = DateTime.now();
  if (allDividends.length) {
    startDate = DateTime.fromMillis(
      Math.min(...(allDividends.map(dividend => dividend.when.toMillis()))),
    ) as DateTime<true>;
    endDate = DateTime.fromMillis(
      Math.max(...(allDividends.map(dividend => dividend.when.toMillis()))),
    ) as DateTime<true>;
  }

  const interval = Interval.fromDateTimes(startDate, endDate);
  const years = interval.splitBy({ year: 1 }).map(d => (d.start as DateTime).year);
  const currentYear = DateTime.now().year;
  if (!years.includes(currentYear)) {
    years.push(DateTime.now().year);
  }

  yearData.labels = years;
  yearData.datasets[0].data = new Array(years.length).fill(0);

  const monthData: ChartData<'bar'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [],
  };

  allDividends.forEach(dividend => {
    (
      yearData.datasets[0].data[years.indexOf(dividend.when.year)] as number
    ) += dividend.amountInCurrency.toNumber();

    if (dividend.when.year === selectedYear) {
      let tickerDataset = (monthData.datasets.find(dataset => dataset.label === dividend.ticker));
      if (!tickerDataset) {
        tickerDataset = { data: new Array(12).fill(0), label: dividend.ticker };
        monthData.datasets.push(tickerDataset);
      }

      (
        tickerDataset.data[dividend.when.month - 1] as number
      ) += dividend.amountInCurrency.toNumber();
    }
  });

  return [yearData, monthData];
}
