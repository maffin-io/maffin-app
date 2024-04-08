import React from 'react';
import type { ChartDataset } from 'chart.js';

import Money from '@/book/Money';
import { useCashFlow } from '@/hooks/api';
import { isLiability } from '@/book/helpers/accountType';
import { moneyToString, toFixed } from '@/helpers/number';
import type { Account } from '@/book/entities';
import Sankey from './Sankey';

export type AssetSankeyProps = {
  account: Account,
  height?: number,
};

export default function AssetSankey({
  account,
  height = 250,
}: AssetSankeyProps): JSX.Element {
  const { data: cashflow, isPending } = useCashFlow(account.guid);

  const labels: { [guid: string]: string } = {
    [account.guid]: account.name,
  };

  let totalIn = new Money(0, account.commodity.mnemonic);
  let totalOut = new Money(0, account.commodity.mnemonic);

  const data = cashflow?.filter(r => r.guid !== account.guid).map(r => {
    labels[r.guid] = r.name;

    if (r.total.isNegative()) {
      totalIn = totalIn.add(r.total.abs());

      return {
        from: r.guid,
        fromType: r.type,
        to: account.guid,
        toType: 'ASSET',
        flow: r.total.abs().toNumber(),
      };
    }

    totalOut = totalOut.add(r.total);
    return {
      from: account.guid,
      fromType: 'ASSET',
      to: r.guid,
      toType: r.type,
      flow: r.total.toNumber(),
    };
  });

  if (!isPending && !data?.length) {
    return (
      <div className="flex h-[400px] text-sm place-content-center place-items-center">
        No movements for this period!
      </div>
    );
  }

  const datasets: ChartDataset<'sankey'>[] = [
    {
      data: data || [],
      labels,
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
        maintainAspectRatio: false,
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
                const raw = ctx.raw as { flow: number, to: string };
                let absolute = moneyToString(-raw.flow, account.commodity.mnemonic);
                let percentage = toFixed((raw.flow / totalOut.toNumber()) * 100);
                if (raw.to === account.guid) {
                  percentage = toFixed((raw.flow / totalIn.toNumber()) * 100);
                  absolute = moneyToString(raw.flow, account.commodity.mnemonic);
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
