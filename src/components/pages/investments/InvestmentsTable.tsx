import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import classNames from 'classnames';
import Link from 'next/link';

import { toFixed, moneyToString } from '@/helpers/number';
import Table from '@/components/Table';
import type { InvestmentAccount } from '@/book/models';
import { currencyToSymbol } from '@/book/helpers';
import * as API from '@/hooks/api';

export default function InvestmentsTable(): JSX.Element {
  let { data: investments } = API.useInvestments();
  investments = (investments || []).filter(
    investment => !investment.isClosed,
  );

  let currency = '';
  if (investments.length) {
    currency = investments[0].mainCurrency;
  }

  columns[4].header = `Value/Cost (in ${currencyToSymbol(currency)})`;
  columns[5].header = `Unrealized profit (in ${currencyToSymbol(currency)})`;

  return (
    <Table<InvestmentAccount>
      id="investments-table"
      columns={columns}
      data={investments}
      initialState={{
        sorting: [{ id: 'unrealizedProfit', desc: true }],
      }}
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
        <Link
          href={`/dashboard/accounts/${row.original.account.guid}`}
          className="badge misc hover:text-slate-300 bg-light"
        >
          {getValue<string>()}
        </Link>
        <br />
        <span className="font-14">
          {row.original.quantity.toNumber()}
          @
          {moneyToString(row.original.avgPrice, row.original.currency)}
        </span>
      </p>
    ),
  },
  {
    accessorFn: (row: InvestmentAccount) => row.quoteInfo.changePct,
    id: 'latest',
    header: 'Latest',
    cell: ({ row, getValue }) => (
      <p className="m-0 d-inline-block align-middle font-16">
        {moneyToString(row.original.quoteInfo.price, row.original.currency)}
        <br />
        <span
          className={classNames('badge', {
            success: getValue<number>() >= 0,
            danger: getValue<number>() <= 0,
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
    accessorFn: (row: InvestmentAccount) => row.unrealizedProfitPct,
    id: 'unrealizedProfit',
    header: 'Unrealized Profit',
    cell: ({ row, getValue }) => (
      <p className="m-0 d-inline-block align-middle font-16">
        {row.original.unrealizedProfitAbs.format()}
        <br />
        <span
          className={classNames('badge', {
            success: row.original.unrealizedProfitAbs.toNumber() >= 0,
            danger: row.original.unrealizedProfitAbs.toNumber() < 0,
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
    accessorFn: (row: InvestmentAccount) => row.unrealizedProfitPctInCurrency,
    id: 'unrealizedProfitInCurrency',
    header: '',
    cell: ({ row, getValue }) => (
      <p className="m-0 d-inline-block align-middle font-16">
        {row.original.unrealizedProfitAbsInCurrency.format()}
        <br />
        <span
          className={classNames('badge', {
            success: row.original.unrealizedProfitAbsInCurrency.toNumber() >= 0,
            danger: row.original.unrealizedProfitAbsInCurrency.toNumber() < 0,
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
                    (
                      row.original.realizedDividends.toNumber() / row.original.cost.toNumber()
                    ) * 100,
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
