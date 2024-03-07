import React from 'react';
import type { ChartDataset } from 'chart.js';

import { useCashFlow, useMainCurrency } from '@/hooks/api';
import { isAsset, isLiability } from '@/book/helpers/accountType';
import { moneyToString, toFixed } from '@/helpers/number';
import Sankey from './Sankey';

export type AssetSankeyProps = {
  guid: string,
  height?: number,
};

export default function AssetSankey({
  guid,
  height = 250,
}: AssetSankeyProps): JSX.Element {
  const { data: byAccount, isPending } = useCashFlow(guid);
  const { data: currency } = useMainCurrency();

  const assetName = byAccount?.find(r => r.guid === guid)?.name || '';

  let totalIn = 0;
  let totalOut = 0;

  const data = byAccount?.filter(r => r.guid !== guid).map(r => {
    if (r.total < 0) {
      totalIn += Math.abs(r.total);

      return {
        from: r.name,
        fromType: r.type,
        to: assetName,
        toType: 'ASSET',
        flow: Math.abs(r.total),
      };
    }

    totalOut += r.total;
    return {
      from: assetName,
      fromType: 'ASSET',
      to: r.name,
      toType: r.type,
      flow: r.total,
    };
  });

  if (!isPending && !data?.length) {
    return (
      <div className="flex h-[400px] text-sm place-content-center place-items-center">
        No movements this month yet!
      </div>
    );
  }

  const datasets: ChartDataset<'sankey'>[] = [
    {
      data: data || [],
      colorFrom: (d) => {
        if (!d.raw) {
          return '';
        }
        const raw = d.raw as { fromType: string };
        return getColor(raw.fromType);
      },
      colorTo: (d) => {
        if (!d.raw) {
          return '';
        }
        const raw = d.raw as { toType: string };
        return getColor(raw.toType);
      },
      borderWidth: 0,
      nodeWidth: 2,
      color: '#94A3B8',
    },
  ];

  return (
    <Sankey
      height={height}
      data={{
        datasets,
      }}
      options={{
        plugins: {
          title: {
            display: true,
            text: 'Cash flow',
            align: 'start',
            padding: {
              top: 0,
              bottom: 30,
            },
            font: {
              size: 18,
            },
          },
          tooltip: {
            backgroundColor: '#323b44',
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const raw = ctx.raw as { flow: number, toType: string };
                let absolute = moneyToString(-raw.flow, currency?.mnemonic || '');
                let percentage = toFixed((raw.flow / totalOut) * 100);
                if (isAsset(raw.toType)) {
                  percentage = toFixed((raw.flow / totalIn) * 100);
                  absolute = moneyToString(raw.flow, currency?.mnemonic || '');
                }
                return `${absolute} (${percentage} %)`;
              },
            },
          },
        },
      }}
    />
  );
}

function getColor(type: string): string {
  if (type === 'EXPENSE') {
    return '#DC2626';
  }

  if (type === 'INCOME') {
    return '#16A34A';
  }

  if (isLiability(type)) {
    return '#EA580C';
  }

  return '#0891B2';
}
