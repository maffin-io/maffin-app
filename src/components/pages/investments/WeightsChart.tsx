import React from 'react';

import Tree from '@/components/charts/Tree';
import Money from '@/book/Money';
import { toFixed, moneyToString } from '@/helpers/number';
import * as API from '@/hooks/api';

export type WeightsChartProps = {
  totalValue: Money,
};

export default function WeightsChart({
  totalValue,
}: WeightsChartProps): JSX.Element {
  let { data: investments } = API.useInvestments();
  investments = investments || [];

  const { data: currency } = API.useMainCurrency();
  const unit = currency?.mnemonic || '';

  const data: { [ticker: string]: {
    ticker: string,
    value: number,
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
        ticker: investment.account.name,
        value: toFixed(investmentValueInCurrency),
        today: (
          toFixed(todayChangePct) > 0 ? `+${toFixed(todayChangePct)}%` : `${toFixed(todayChangePct)}%`
        ),
        pct: percentage,
        color,
      };
    }
  });

  return (
    <Tree
      height="625"
      data={{
        datasets: [
          {
            tree: Object.values(data),
            data: [],
            key: 'value',
            borderWidth: 0,
            spacing: 0.25,
            backgroundColor: (ctx) => {
              if (ctx.type !== 'data') {
                return 'transparent';
              }
              // extracted from https://chartjs-chart-treemap.pages.dev/samples/labelsFontsAndColors.html
              // @ts-ignore
              return `${ctx.raw._data.color}CC`;
            },
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            displayColors: false,
            backgroundColor: (
              tooltipItem,
            ) => tooltipItem.tooltip.labelColors[0].backgroundColor,
            callbacks: {
              title: (tooltipItems) => {
                if (tooltipItems.length) {
                  const ctx = tooltipItems[0];
                  // @ts-ignore
                  const raw = ctx.dataset.data[ctx.dataIndex]?._data;
                  return raw.ticker;
                }
                return '';
              },
              // @ts-ignore
              label: (ctx) => `${moneyToString(Number(ctx.raw._data.value), unit)} (${ctx.raw._data.pct}%)`,
            },
          },
          datalabels: {
            color: 'white',
            textAlign: 'center',
            font: (ctx) => {
              // @ts-ignore
              const raw = ctx.dataset.data[ctx.dataIndex]?._data;
              let size = 10;
              if (raw.pct > 20) {
                size = 12;
              }
              if (raw.pct < 1) {
                size = 6;
              }
              return {
                size,
                weight: 400,
                family: 'Intervariable',
              };
            },
            formatter: (_, ctx) => {
              // @ts-ignore
              const raw = ctx.dataset.data[ctx.dataIndex]?._data;
              return [raw.ticker, raw.today];
            },
          },
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
