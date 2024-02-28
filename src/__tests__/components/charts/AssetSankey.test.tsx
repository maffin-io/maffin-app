import React from 'react';
import { render, screen } from '@testing-library/react';
import * as query from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { AssetSankey } from '@/components/charts';
import Sankey from '@/components/charts/Sankey';
import * as apiHooks from '@/hooks/api';
import type { Commodity } from '@/book/entities';

jest.mock('@tanstack/react-query');
jest.mock('@/hooks/api');

jest.mock('@/components/charts/Sankey', () => jest.fn(
  () => <div data-testid="Sankey" />,
));

describe('AssetSankey', () => {
  beforeEach(() => {
    jest.spyOn(query, 'useQuery').mockReturnValue({ data: undefined } as UseQueryResult);
    jest.spyOn(apiHooks, 'useMainCurrency').mockReturnValue(
      { data: { mnemonic: 'EUR' } as Commodity } as UseQueryResult<Commodity>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with no data', () => {
    render(<AssetSankey guid="guid" />);

    screen.getByText('No movements this month yet', { exact: false });
  });

  it('generates data as expected', () => {
    jest.spyOn(query, 'useQuery').mockReturnValue(
      {
        data: [
          {
            guid: 'guid1',
            name: '1',
            type: 'BANK',
            total: 10,
          },
          {
            guid: 'guid2',
            name: '2',
            type: 'INCOME',
            total: -10,
          },
          {
            guid: 'guid3',
            name: '3',
            type: 'INCOME',
            total: -20,
          },
          {
            guid: 'guid4',
            name: '4',
            type: 'EXPENSE',
            total: 10,
          },
          {
            guid: 'guid5',
            name: '5',
            type: 'LIABILITY',
            total: 20,
          },
          {
            guid: 'guid6',
            name: '6',
            type: 'ASSET',
            total: 30,
          },

        ],
      } as UseQueryResult,
    );

    render(<AssetSankey guid="guid1" />);

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
              data: [
                {
                  flow: 10,
                  from: '2',
                  fromType: 'INCOME',
                  to: '1',
                  toType: 'ASSET',
                },
                {
                  flow: 20,
                  from: '3',
                  fromType: 'INCOME',
                  to: '1',
                  toType: 'ASSET',
                },
                {
                  flow: 10,
                  from: '1',
                  fromType: 'ASSET',
                  to: '4',
                  toType: 'EXPENSE',
                },
                {
                  flow: 20,
                  from: '1',
                  fromType: 'ASSET',
                  to: '5',
                  toType: 'LIABILITY',
                },
                {
                  flow: 30,
                  from: '1',
                  fromType: 'ASSET',
                  to: '6',
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

    expect(label({ raw: { flow: 10, toType: 'EXPENSE' } })).toEqual('€10.00 (16.67 %)');
    expect(label({ raw: { flow: 10, toType: 'ASSET' } })).toEqual('€10.00 (33.33 %)');
  });
});
