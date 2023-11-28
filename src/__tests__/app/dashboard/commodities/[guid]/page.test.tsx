import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';
import { SWRConfig } from 'swr';

import { Commodity, Price } from '@/book/entities';
import CommodityPage from '@/app/dashboard/commodities/[guid]/page';
import { PricesTable, PricesChart } from '@/components/pages/commodity';
import CommodityFormButton from '@/components/buttons/CommodityFormButton';
import PriceFormButton from '@/components/buttons/PriceFormButton';
import * as apiHook from '@/hooks/api';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/pages/commodity/PricesTable', () => jest.fn(
  () => <div data-testid="PricesTable" />,
));

jest.mock('@/components/pages/commodity/PricesChart', () => jest.fn(
  () => <div data-testid="PricesChart" />,
));

jest.mock('@/components/buttons/PriceFormButton', () => jest.fn(
  () => <div data-testid="PriceFormButton" />,
));

jest.mock('@/components/buttons/CommodityFormButton', () => jest.fn(
  () => <div data-testid="CommodityFormButton" />,
));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('CommodityPage', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when loading data', async () => {
    const { container } = render(<CommodityPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('Loading');
    expect(CommodityFormButton).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('shows commodity not found message', async () => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue(
      { data: [{ guid: 'guid', mnemonic: 'EUR ' } as Commodity] } as SWRResponse,
    );
    const { container } = render(<CommodityPage params={{ guid: 'unknown' }} />);

    screen.getByText('does not exist', { exact: false });
    expect(CommodityFormButton).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with commodity', async () => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue(
      { data: [{ guid: 'guid', mnemonic: 'EUR' } as Commodity] } as SWRResponse,
    );
    const prices = [
      {
        guid: '1',
        value: 100,
        currency: {
          guid: 'c1',
          mnemonic: 'USD',
        },
        commodity: {
          mnemonic: 'EUR',
        },
      } as Price,
      {
        guid: '2',
        value: 100,
        currency: {
          guid: 'c2',
          mnemonic: 'SGD',
        },
        commodity: {
          mnemonic: 'EUR',
        },
      } as Price,
    ];
    jest.spyOn(Price, 'findBy').mockResolvedValue(prices);
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <CommodityPage params={{ guid: 'guid' }} />
      </SWRConfig>,
    );

    await screen.findByText('EUR');
    expect(CommodityFormButton).toBeCalledWith(
      expect.objectContaining({
        action: 'update',
        defaultValues: {
          guid: 'guid',
          mnemonic: 'EUR',
        },
      }),
      {},
    );
    expect(PriceFormButton).toBeCalledWith(
      {
        defaultValues: {
          fk_commodity: {
            guid: 'guid',
            mnemonic: 'EUR',
          },
          fk_currency: undefined,
        },
      },
      {},
    );
    expect(PricesTable).toHaveBeenNthCalledWith(
      1,
      {
        prices: [
          prices[0],
        ],
      },
      {},
    );
    expect(PricesTable).toHaveBeenNthCalledWith(
      2,
      {
        prices: [
          prices[1],
        ],
      },
      {},
    );
    expect(PricesChart).toHaveBeenNthCalledWith(
      1,
      {
        prices: [
          prices[0],
        ],
      },
      {},
    );
    expect(PricesChart).toHaveBeenNthCalledWith(
      2,
      {
        prices: [
          prices[1],
        ],
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('calls PriceButton with fk_currency when not CURRENCY', async () => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue(
      { data: [{ guid: 'guid', mnemonic: 'GOOGL', namespace: 'STOCK' } as Commodity] } as SWRResponse,
    );
    const prices = [
      {
        guid: '1',
        value: 100,
        fk_currency: {
          guid: 'c1',
          mnemonic: 'USD',
        },
        currency: {
          guid: 'c1',
          mnemonic: 'USD',
        },
        commodity: {
          mnemonic: 'GOOGL',
        },
      } as Price,
    ];
    jest.spyOn(Price, 'findBy').mockResolvedValue(prices);
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <CommodityPage params={{ guid: 'guid' }} />
      </SWRConfig>,
    );

    await screen.findByText('GOOGL');
    expect(PriceFormButton).toBeCalledWith(
      {
        defaultValues: {
          fk_commodity: {
            guid: 'guid',
            mnemonic: 'GOOGL',
            namespace: 'STOCK',
          },
          fk_currency: {
            guid: 'c1',
            mnemonic: 'USD',
          },
        },
      },
      {},
    );
  });
});
