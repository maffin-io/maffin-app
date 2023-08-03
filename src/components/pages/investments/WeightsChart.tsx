import React from 'react';

import Chart from '@/components/charts/Chart';
import type { InvestmentAccount } from '@/book/models';
import Money from '@/book/Money';
import { toFixed, moneyToString } from '@/helpers/number';

export type WeightsChartProps = {
  investments: InvestmentAccount[],
  totalValue: Money,
};

export default function WeightsChart({
  investments,
  totalValue,
}: WeightsChartProps): JSX.Element {
  const data: { [ticker: string]: {
    x: string,
    y: number,
    today: string,
    pct: number,
    color: string,
  } } = {};

  const percentages = investments.map(investment => investment.quoteInfo.changePct);
  const bestProfit = Math.max(...percentages);
  const worstProfit = Math.min(...percentages);

  investments.forEach(investment => {
    const investmentValueInCurrency = investment.valueInCurrency.toNumber();
    const percentage = toFixed((investmentValueInCurrency / totalValue.toNumber()) * 100);
    const todayChangePct = investment.quoteInfo.changePct;

    let color = '';
    if (todayChangePct < 0) {
      color = getStockColor(todayChangePct, worstProfit, 0, RED, LIGHT_RED);
    } else {
      color = getStockColor(todayChangePct, 0, bestProfit, LIGHT_GREEN, GREEN);
    }

    if (investmentValueInCurrency > 0) {
      data[investment.account.name] = {
        x: investment.account.name,
        y: toFixed(investmentValueInCurrency),
        today: (
          toFixed(todayChangePct) > 0 ? `+${toFixed(todayChangePct)}%` : `${toFixed(todayChangePct)}%`
        ),
        pct: percentage,
        color,
      };
    }
  });

  const series = [
    {
      data: Object.values(data),
    },
  ];

  return (
    <Chart
      type="treemap"
      series={series}
      height={650}
      dataLabels={
        {
          enabled: true,
          style: {
            fontSize: '12px',
          },
          // @ts-ignore
          formatter: (text: string) => `${text}: ${data[text].today}`,
          offsetY: -4,
        }
      }
      plotOptions={
        {
          treemap: {
            useFillColorAsStroke: true,
            colorScale: {
              ranges: Object.values(data).map(each => ({
                from: each.y,
                to: each.y,
                color: each.color,
              })),
            },
          },
        }
      }
      tooltip={{
        y: {
          formatter: (val: number, { dataPointIndex, w }) => (
            `${moneyToString(val, totalValue.currency)} (${data[w.globals.categoryLabels[dataPointIndex]].pct}%)`
          ),
        },
      }}
    />
  );
}

const RED = '#D12B2B';
const GREEN = '#52B12C';
const LIGHT_GREEN = '#B9DFA9';
const LIGHT_RED = '#FFECEC';

function getStockColor(
  value: number,
  minValue: number,
  maxValue: number,
  minColor: string,
  maxColor: string,
): string {
  const normalizedValue = (value - minValue) / (maxValue - minValue);
  const startColor = hexToRgb(minColor);
  const endColor = hexToRgb(maxColor);
  const red = Math.round(startColor.r + normalizedValue * (endColor.r - startColor.r));
  const green = Math.round(startColor.g + normalizedValue * (endColor.g - startColor.g));
  const blue = Math.round(startColor.b + normalizedValue * (endColor.b - startColor.b));
  return rgbToHex(red, green, blue);
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const num = parseInt(hex.replace('#', ''), 16);
  return {
    // eslint-disable-next-line no-bitwise
    r: (num >> 16) & 255,
    // eslint-disable-next-line no-bitwise
    g: (num >> 8) & 255,
    // eslint-disable-next-line no-bitwise
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  }).join('')}`;
}
