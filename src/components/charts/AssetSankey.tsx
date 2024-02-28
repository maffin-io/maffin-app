import React from 'react';
import { DateTime } from 'luxon';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { ChartDataset } from 'chart.js';

import { Split, Transaction } from '@/book/entities';
import { useMainCurrency } from '@/hooks/api';
import { isAsset, isLiability } from '@/book/helpers/accountType';
import { moneyToString, toFixed } from '@/helpers/number';
import Sankey from './Sankey';

export type AssetSankeyProps = {
  guid: string,
};

export default function AssetSankey({
  guid,
}: AssetSankeyProps): JSX.Element {
  const selectedDate = DateTime.now();

  const { data: byAccount, isPending } = useQuery({
    queryKey: [...Split.CACHE_KEY, guid, 'total-by-account', selectedDate.toISODate()],
    queryFn: () => Transaction.query(`
      SELECT
        splits.account_guid as guid,
        accounts.name,
        accounts.account_type as type,
        SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) as total
      FROM transactions AS tx
      JOIN splits ON splits.tx_guid = tx.guid
      JOIN accounts ON splits.account_guid = accounts.guid
      WHERE tx.guid IN (
        SELECT DISTINCT tx_guid
        FROM splits
        WHERE account_guid = '${guid}'
      )
      AND tx.post_date >= '${selectedDate.startOf('month').toSQLDate()}'
      GROUP BY splits.account_guid
      HAVING SUM(cast(splits.quantity_num as REAL) / splits.quantity_denom) != 0
    `),
  }) as UseQueryResult<{ guid: string, total: number, type: string, name: string }[]>;
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

    totalOut += Math.abs(r.total);
    return {
      from: assetName,
      fromType: 'ASSET',
      to: r.name,
      toType: r.type,
      flow: Math.abs(r.total),
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
      height={250}
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
                const absolute = moneyToString(raw.flow, currency?.mnemonic || '');
                let percentage = toFixed((raw.flow / totalOut) * 100);
                if (isAsset(raw.toType)) {
                  percentage = toFixed((raw.flow / totalIn) * 100);
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
