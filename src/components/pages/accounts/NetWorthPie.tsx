import React from 'react';
import { DateTime } from 'luxon';

import Money from '@/book/Money';
import Chart from '@/components/charts/Chart';
import { moneyToString } from '@/helpers/number';
import * as API from '@/hooks/api';

export type NetWorthPieProps = {
  selectedDate?: DateTime,
};

export default function NetWorthPie({
  selectedDate = DateTime.now(),
}: NetWorthPieProps): JSX.Element {
  const { data: monthlyTotals } = API.useAccountsMonthlyTotals();
  const assetsSeries = monthlyTotals?.asset;
  const liabilitiesSeries = monthlyTotals?.liability;

  const { data: currency } = API.useMainCurrency();
  const unit = currency?.mnemonic || '';

  let series: number[] = [];
  let assetsTotal = 0;
  let liabilitiesTotal = 0;
  assetsTotal = Object.entries(assetsSeries || {}).reduce(
    (total, [monthYear, amount]) => {
      if (DateTime.fromFormat(monthYear, 'MM/yyyy') <= selectedDate) {
        return total.add(amount);
      }
      return total;
    },
    new Money(0, unit),
  ).toNumber();
  liabilitiesTotal = Object.entries(liabilitiesSeries || {}).reduce(
    (total, [monthYear, amount]) => {
      if (DateTime.fromFormat(monthYear, 'MM/yyyy') <= selectedDate) {
        return total.add(amount);
      }
      return total;
    },
    new Money(0, unit),
  ).toNumber() * -1;
  series = [assetsTotal, liabilitiesTotal];

  return (
    <Chart
      type="donut"
      series={series}
      height={300}
      unit={unit}
      options={{
        labels: ['Assets', 'Liabilities'],
        colors: ['#06B6D4', '#F97316'],
        legend: {
          show: false,
        },
        tooltip: {
          enabled: false,
        },
        dataLabels: {
          enabled: true,
          // @ts-ignore types are wrong here as for a breakline we need to return
          // an array
          formatter: (val: number, opts) => {
            const name = opts.w.globals.labels[opts.seriesIndex];
            return [
              name,
              moneyToString(
                opts.w.globals.series[opts.seriesIndex],
                unit,
              ),
            ];
          },
        },
        grid: {
          padding: {
            bottom: -110,
          },
        },
        plotOptions: {
          pie: {
            startAngle: -90,
            endAngle: 90,
            offsetY: 10,
            donut: {
              labels: {
                show: true,
                total: {
                  show: true,
                  showAlways: true,
                  label: 'Net worth',
                  formatter: (opts) => moneyToString(
                    (opts.globals.series[0] || 0) - opts.globals.series[1],
                    unit,
                  ),
                },
              },
            },
          },
        },
        states: {
          hover: {
            filter: {
              type: 'none',
            },
          },
        },
      }}
    />
  );
}
