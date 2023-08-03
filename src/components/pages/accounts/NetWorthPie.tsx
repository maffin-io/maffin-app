import React from 'react';

import Chart from '@/components/charts/Chart';
import type { AccountsTree } from '@/types/accounts';
import { moneyToString } from '@/helpers/number';

export type NetWorthPieProps = {
  tree: AccountsTree,
};

export default function NetWorthPie({
  tree,
}: NetWorthPieProps): JSX.Element {
  let series: number[] = [];
  let assetsTotal = 0;
  let liabilitiesTotal = 0;
  let unit = '';

  if ((tree?.children || []).length) {
    const assetsAccount = tree.children.find(a => a.account.type === 'ASSET');
    const liabilitiesAccount = tree.children.find(a => a.account.type === 'LIABILITY');

    assetsTotal = assetsAccount?.total.toNumber() || 0;
    liabilitiesTotal = liabilitiesAccount?.total.toNumber() || 0;
    unit = assetsAccount?.account.commodity.mnemonic;
    series = [assetsTotal, liabilitiesTotal];
  }

  return (
    <Chart
      type="donut"
      series={series}
      labels={['Assets', 'Liabilities']}
      colors={['#06B6D4', '#F97316']}
      height={300}
      unit={unit}
      showLegend={false}
      tooltip={{
        enabled: false,
      }}
      dataLabels={{
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
        style: {
          colors: ['#DDDDDD'],
        },
        dropShadow: {
          enabled: false,
        },
      }}
      grid={{
        padding: {
          bottom: -110,
        },
      }}
      plotOptions={{
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
      }}
      states={{
        hover: {
          filter: {
            type: 'none',
          },
        },
      }}
    />
  );
}
