import React from 'react';
import { DateTime } from 'luxon';

import Money from '@/book/Money';
import Pie from '@/components/charts/Pie';
import { moneyToString } from '@/helpers/number';
import { useAccountsTotal, useMainCurrency } from '@/hooks/api';

export type NetWorthPieProps = {
  selectedDate?: DateTime,
};

export default function NetWorthPie({
  selectedDate,
}: NetWorthPieProps): JSX.Element {
  const { data: totals } = useAccountsTotal(selectedDate);

  const { data: currency } = useMainCurrency();
  const unit = currency?.mnemonic || '';

  const assetsTotal = totals?.type_asset || new Money(0, unit);
  const liabilitiesTotal = totals?.type_liability || new Money(0, unit);

  return (
    <>
      <Pie
        data={{
          labels: ['Assets', 'Liabilities'],
          datasets: [
            {
              backgroundColor: ['#06B6D4', '#F97316'],
              data: [assetsTotal.toNumber(), liabilitiesTotal.toNumber()],
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
              formatter: (value, context) => {
                if (value > 0) {
                  return `${context.chart.data.labels?.[context.dataIndex]}\n${moneyToString(value, unit)}`;
                }
                return '';
              },
              padding: 6,
            },
          },
        }}
      />
      <div className="-mt-12">
        <p className="flex justify-center">Net worth</p>
        <p className="flex justify-center text-xl">
          {moneyToString(assetsTotal.toNumber() - liabilitiesTotal.toNumber(), unit)}
        </p>
      </div>
    </>
  );
}
