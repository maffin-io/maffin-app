import React from 'react';
import { DateTime } from 'luxon';

import Money from '@/book/Money';
import Pie from '@/components/charts/Pie';
import * as API from '@/hooks/api';
import { moneyToString } from '@/helpers/number';

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

  return (
    <>
      <Pie
        data={{
          labels: ['Assets', 'Liabilities'],
          datasets: [
            {
              backgroundColor: ['#06B6D4', '#F97316'],
              data: [assetsTotal, liabilitiesTotal],
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
              enabled: false,
            },
            datalabels: {
              borderRadius: 2,
              color: '#DDDDDD',
              textAlign: 'center',
              formatter: (value, context) => `${context.chart.data.labels?.[context.dataIndex]}\n${moneyToString(value, unit)}`,
              font: {
                weight: 300,
                family: 'Intervariable',
                size: 14,
              },
              padding: 6,
            },
          },
        }}
      />
      <div className="-mt-12">
        <p className="flex justify-center">Net worth</p>
        <p className="flex justify-center text-xl">{moneyToString(assetsTotal - liabilitiesTotal, unit)}</p>
      </div>
    </>
  );
}
