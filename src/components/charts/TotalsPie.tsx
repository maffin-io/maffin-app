import React from 'react';
import { DateTime } from 'luxon';

import Money, { convert } from '@/book/Money';
import Pie from '@/components/charts/Pie';
import {
  useAccounts,
  useAccountsTotals,
  useMainCurrency,
  usePrices,
} from '@/hooks/api';
import { useInterval } from '@/hooks/state';
import { moneyToString, toFixed } from '@/helpers/number';

export type TotalsPieProps = {
  guids?: string[],
  title: string,
  backgroundColor?: string[],
  showTooltip?: boolean,
  showDataLabels?: boolean,
};

export default function TotalsPie({
  title,
  guids = [],
  backgroundColor,
  showTooltip = false,
  showDataLabels = true,
}: TotalsPieProps): JSX.Element {
  const { data: interval } = useInterval();
  const { data: totals } = useAccountsTotals();
  const { data: accounts } = useAccounts();

  const { data: currency } = useMainCurrency();
  const { data: prices } = usePrices({});
  const unit = currency?.mnemonic || '';

  const data = React.useMemo(() => {
    if (!accounts || !prices || !currency || !totals) {
      return [];
    }

    return guids.map(guid => {
      let total = totals?.[guid] || new Money(0, unit);
      const account = accounts?.find(a => a.guid === guid);
      if (account && currency && account.commodity.guid !== currency?.guid) {
        total = convert(total, account.commodity, currency, prices, interval.end as DateTime<true>);
      }
      return total;
    });
  }, [guids, currency, totals, unit, accounts, prices, interval.end]);

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
              data: data.map(d => d.toNumber()),
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
          {total.format()}
        </p>
      </div>
    </>
  );
}
