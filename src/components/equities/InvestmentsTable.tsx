import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import classNames from 'classnames';

import { toFixed } from '@/helpers/number';
import Table from '@/components/Table';
import type { InvestmentAccount } from '@/book/models';
import { currencyToSymbol } from '@/book/helpers';

export type InvestmentsTableProps = {
  investments: InvestmentAccount[],
};

export default function InvestmentsTable(
  { investments }: InvestmentsTableProps,
): JSX.Element {
  let currency = '';
  if (investments.length) {
    currency = investments[0].mainCurrency;
  }

  columns[4].header = `Value/Cost (in ${currencyToSymbol(currency)})`;
  columns[5].header = `Unrealized profit (in ${currencyToSymbol(currency)})`;

  return (
    <Table<InvestmentAccount>
      columns={columns}
      data={investments}
      initialSort={{ id: 'unrealizedProfit', desc: true }}
      showPagination={false}
    />
  );
}

const columns: ColumnDef<InvestmentAccount>[] = [
  {
    accessorFn: (row: InvestmentAccount) => row.account.name,
    id: 'ticker',
    header: 'Ticker',
    enableSorting: false,
    cell: ({ row, getValue }) => (
      <p className="m-0 d-inline-block align-middle font-18">
        <span className="badge bg-light">
          {getValue<string>()}
        </span>
        <br />
        <span className="font-14">
          {row.original.quantity.toNumber()}
          @
          {currencyToSymbol(row.original.currency)}
          {toFixed(row.original.avgPrice)}
        </span>
      </p>
    ),
  },
  {
    accessorFn: (row: InvestmentAccount) => row.quoteInfo.changePct,
    id: 'today',
    header: 'Today',
    cell: ({ row, getValue }) => (
      <p className="m-0 d-inline-block align-middle font-16">
        {currencyToSymbol(row.original.currency)}
        {toFixed(row.original.quoteInfo.price)}
        <br />
        <span
          className={classNames('badge', {
            'bg-green-500/20 text-green-300': getValue<number>() >= 0,
            'bg-red-500/20 text-red-300': getValue<number>() <= 0,
          })}
        >
          {toFixed(getValue<number>())}
          %
        </span>
      </p>
    ),
  },
  {
    accessorFn: (row: InvestmentAccount) => row.value.toNumber(),
    id: 'value/cost',
    header: 'Value/Cost',
    enableSorting: false,
    cell: ({ row }) => (
      <p className="m-0 d-inline-block align-middle font-16">
        {row.original.value.format()}
        <br />
        <span className="font-14">
          {row.original.cost.format()}
        </span>
      </p>
    ),
  },
  {
    accessorFn: (row: InvestmentAccount) => row.profitPct,
    id: 'unrealizedProfit',
    header: 'Unrealized Profit',
    cell: ({ row, getValue }) => (
      <p className="m-0 d-inline-block align-middle font-16">
        {row.original.profitAbs.format()}
        <br />
        <span
          className={classNames('badge', {
            'bg-green-500/20 text-green-300': row.original.profitAbs.toNumber() >= 0,
            'bg-red-500/20 text-red-300': row.original.profitAbs.toNumber() < 0,
          })}
        >
          {toFixed(getValue<number>())}
          %
        </span>
      </p>
    ),
  },
  {
    accessorFn: (row: InvestmentAccount) => row.valueInCurrency.toNumber(),
    id: 'valueInCurrency',
    header: '',
    cell: ({ row }) => (
      <p className="m-0 d-inline-block align-middle font-16">
        {row.original.valueInCurrency.format()}
        <br />
        <span className="font-14">
          {row.original.costInCurrency.format()}
        </span>
      </p>
    ),
  },
  {
    accessorFn: (row: InvestmentAccount) => row.profitPctInCurrency,
    id: 'profitInCurrency',
    header: '',
    cell: ({ row, getValue }) => (
      <p className="m-0 d-inline-block align-middle font-16">
        {row.original.profitAbsInCurrency.format()}
        <br />
        <span
          className={classNames('badge', {
            'bg-green-500/20 text-green-300': row.original.profitAbsInCurrency.toNumber() >= 0,
            'bg-red-500/20 text-red-300': row.original.profitAbsInCurrency.toNumber() < 0,
          })}
        >
          {toFixed(getValue<number>())}
          %
        </span>
      </p>
    ),
  },
  {
    accessorFn: (row: InvestmentAccount) => row.realizedProfit.toNumber(),
    id: 'realized',
    header: 'Realized/Dividends',
    enableSorting: false,
    cell: ({ row }) => (
      <p className="m-0 d-inline-block align-middle font-16">
        <span title="total realized">
          {row.original.realizedProfit.format()}
        </span>
        <br />
        {
          !row.original.realizedDividends.isZero()
          && (
            <span className="font-14">
              <span className="mdi mdi-cash" title="dividends">
                {' '}
                {row.original.realizedDividends.format()}
              </span>
              {' '}
              <span className="mdi mdi-chart-line" title="dividends percentage">
                {' '}
                {
                  toFixed(
                    row.original.realizedDividends.toNumber()
                    / row.original.cost.toNumber() * 100,
                  )
                }
                %
              </span>
            </span>
          )
        }
      </p>
    ),
  },
];
