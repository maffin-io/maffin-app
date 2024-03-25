import React from 'react';
import { render, screen } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import { AssetSankey } from '@/components/charts';
import Sankey from '@/components/charts/Sankey';
import Money from '@/book/Money';
import * as apiHooks from '@/hooks/api';
import type { Account } from '@/book/entities';
import type { CashFlowRow } from '@/hooks/api/useCashFlow';

jest.mock('@/hooks/api');

jest.mock('@/components/charts/Sankey', () => jest.fn(
  () => <div data-testid="Sankey" />,
));

describe('AssetSankey', () => {
  let account: Account;

  beforeEach(() => {
    account = {
      guid: 'guid1',
      name: '1',
      commodity: { mnemonic: 'EUR' },
    } as Account;
    jest.spyOn(apiHooks, 'useCashFlow').mockReturnValue({ data: undefined } as UseQueryResult<CashFlowRow[]>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with no data', () => {
    render(<AssetSankey account={account} />);

    screen.getByText('No movements for this period', { exact: false });
  });

  it('generates data as expected', () => {
    jest.spyOn(apiHooks, 'useCashFlow').mockReturnValue(
      {
        data: [
          {
            guid: 'guid2',
            name: '2',
            type: 'INCOME',
            total: new Money(-10, 'EUR'),
          },
          {
            guid: 'guid3',
            name: '3',
            type: 'INCOME',
            total: new Money(-20, 'EUR'),
          },
          {
            guid: 'guid4',
            name: '4',
            type: 'EXPENSE',
            total: new Money(10, 'EUR'),
          },
          {
            guid: 'guid5',
            name: '5',
            type: 'LIABILITY',
            total: new Money(20, 'EUR'),
          },
          {
            guid: 'guid6',
            name: '6',
            type: 'ASSET',
            total: new Money(30, 'EUR'),
          },
        ],
      } as UseQueryResult<CashFlowRow[]>,
    );

    render(<AssetSankey account={account} />);

    expect(Sankey).toBeCalledWith(
      {
        height: 250,
        options: {
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
                label: expect.any(Function),
              },
            },
          },
        },
        data: {
          datasets: [
            {
              borderWidth: 0,
              color: '#94A3B8',
              colorFrom: expect.any(Function),
              colorTo: expect.any(Function),
              nodeWidth: 2,
              labels: {
                guid1: '1',
                guid2: '2',
                guid3: '3',
                guid4: '4',
                guid5: '5',
                guid6: '6',
              },
              data: [
                {
                  flow: 10,
                  from: 'guid2',
                  fromType: 'INCOME',
                  to: 'guid1',
                  toType: 'ASSET',
                },
                {
                  flow: 20,
                  from: 'guid3',
                  fromType: 'INCOME',
                  to: 'guid1',
                  toType: 'ASSET',
                },
                {
                  flow: 10,
                  from: 'guid1',
                  fromType: 'ASSET',
                  to: 'guid4',
                  toType: 'EXPENSE',
                },
                {
                  flow: 20,
                  from: 'guid1',
                  fromType: 'ASSET',
                  to: 'guid5',
                  toType: 'LIABILITY',
                },
                {
                  flow: 30,
                  from: 'guid1',
                  fromType: 'ASSET',
                  to: 'guid6',
                  toType: 'ASSET',
                },
              ],
            },
          ],
        },
      },
      {},
    );

    const { colorTo, colorFrom } = (Sankey as jest.Mock).mock.calls[0][0].data.datasets[0];

    expect(colorTo({})).toEqual('');
    expect(colorTo({ raw: { toType: 'ASSET' } })).toEqual('#0891B2');
    expect(colorTo({ raw: { toType: 'LIABILITY' } })).toEqual('#EA580C');
    expect(colorTo({ raw: { toType: 'INCOME' } })).toEqual('#16A34A');
    expect(colorTo({ raw: { toType: 'EXPENSE' } })).toEqual('#DC2626');

    expect(colorFrom({})).toEqual('');
    expect(colorFrom({ raw: { fromType: 'ASSET' } })).toEqual('#0891B2');
    expect(colorFrom({ raw: { fromType: 'LIABILITY' } })).toEqual('#EA580C');
    expect(colorFrom({ raw: { fromType: 'INCOME' } })).toEqual('#16A34A');
    expect(colorFrom({ raw: { fromType: 'EXPENSE' } })).toEqual('#DC2626');

    const { label } = (Sankey as jest.Mock).mock.calls[0][0].options.plugins.tooltip.callbacks;

    expect(label({ raw: { flow: 10, to: 'guid4' } })).toEqual('-€10.00 (16.67 %)');
    expect(label({ raw: { flow: 10, to: 'guid1' } })).toEqual('€10.00 (33.33 %)');
  });
});
