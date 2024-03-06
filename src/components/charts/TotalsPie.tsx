import React from 'react';
import { DateTime } from 'luxon';

import Money from '@/book/Money';
import Pie from '@/components/charts/Pie';
import { useAccounts, useAccountsTotals, useMainCurrency } from '@/hooks/api';
import type { Account } from '@/book/entities';
import { moneyToString, toFixed } from '@/helpers/number';

export type TotalsPieProps = {
  guids?: string[],
  title: string,
  backgroundColor?: string[],
  selectedDate?: DateTime,
  showTooltip?: boolean,
  showDataLabels?: boolean,
};

export default function TotalsPie({
  title,
  guids = [],
  backgroundColor,
  selectedDate,
  showTooltip = false,
  showDataLabels = true,
}: TotalsPieProps): JSX.Element {
  const { data: totals } = useAccountsTotals(selectedDate);
  const { data: accounts } = useAccounts();

  const { data: currency } = useMainCurrency();
  const unit = currency?.mnemonic || '';

  const data = guids.map(guid => totals?.[guid] || new Money(0, unit));
  const total = data.reduce(
    (t, d) => t.add(d),
    new Money(0, unit),
  );
  const labels = guids.map(guid => accounts?.find(a => a.guid === guid)?.name || '');

  return (
    <>
      <Pie
        data={{
          labels,
          datasets: [
            {
              backgroundColor,
              data: data.map(d => Math.abs(d.toNumber())),
            },
          ],
        }}
        options={{
          cutout: '65%',
          aspectRatio: 1.5,
          rotation: -90,
          circumference: 180,
          layout: {
            padding: 40,
          },
          plugins: {
            tooltip: {
              enabled: showTooltip,
              displayColors: false,
              callbacks: {
                label: (ctx) => `${moneyToString(Number(ctx.raw), unit)} (${toFixed((Number(ctx.raw) / Math.abs(total.toNumber())) * 100)}%)`,
              },
            },
            datalabels: {
              display: showDataLabels,
              borderRadius: 2,
              color: '#DDDDDD',
              textAlign: 'center',
              formatter: (value, context) => (
                `${labels[context.dataIndex]}\n${moneyToString(value, unit)}`
              ),
              padding: 6,
            },
          },
        }}
      />
      <div className="-mt-12">
        <p className="flex justify-center">{title}</p>
        <p className="flex justify-center text-xl">
          {total.abs().format()}
        </p>
      </div>
    </>
  );
}
