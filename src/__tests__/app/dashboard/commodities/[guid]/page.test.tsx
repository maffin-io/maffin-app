import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';
import { UseQueryResult } from '@tanstack/react-query';

import { Commodity, Price } from '@/book/entities';
import CommodityPage from '@/app/dashboard/commodities/[guid]/page';
import { PricesTable, PricesChart } from '@/components/pages/commodity';
import FormButton from '@/components/buttons/FormButton';
import * as apiHook from '@/hooks/api';
import PriceForm from '@/components/forms/price/PriceForm';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
import { PriceDBMap } from '@/book/prices';

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

jest.mock('@/components/buttons/FormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="FormButton">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/price/PriceForm', () => jest.fn(
  () => <div data-testid="PriceForm" />,
));

jest.mock('@/components/forms/commodity/CommodityForm', () => jest.fn(
  () => <div data-testid="CommodityForm" />,
));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('CommodityPage', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useCommodity').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when loading data', async () => {
    jest.spyOn(apiHook, 'useCommodity').mockReturnValue({ isLoading: true } as UseQueryResult<Commodity>);
    render(<CommodityPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('Loading');
    expect(FormButton).toHaveBeenCalledTimes(0);
  });

  it('shows commodity not found message', async () => {
    const { container } = render(<CommodityPage params={{ guid: 'unknown' }} />);

    screen.getByText('does not exist', { exact: false });
    expect(FormButton).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('loads when no prices', async () => {
    jest.spyOn(apiHook, 'useCommodity').mockReturnValue(
      { data: { guid: 'guid', mnemonic: 'EUR' } as Commodity } as UseQueryResult<Commodity>,
    );
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({ data: new PriceDBMap([]) } as SWRResponse);

    render(<CommodityPage params={{ guid: 'guid' }} />);

    await screen.findByText('EUR');
  });

  it('renders as expected with commodity', async () => {
    jest.spyOn(apiHook, 'useCommodity').mockReturnValue(
      { data: { guid: 'guid', mnemonic: 'EUR' } as Commodity } as UseQueryResult<Commodity>,
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
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({ data: new PriceDBMap(prices) } as SWRResponse);

    const { container } = render(<CommodityPage params={{ guid: 'guid' }} />);

    await screen.findByText('EUR');
    expect(FormButton).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        modalTitle: 'Add price',
        id: 'add-price',
      }),
      {},
    );
    expect(PriceForm).toHaveBeenNthCalledWith(
      1,
      {
        defaultValues: {
          fk_commodity: {
            guid: 'guid',
            mnemonic: 'EUR',
          },
          fk_currency: undefined,
        },
        hideDefaults: true,
      },
      {},
    );
    expect(FormButton).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        modalTitle: 'Edit EUR',
        id: 'edit-commodity',
      }),
      {},
    );
    expect(CommodityForm).toHaveBeenNthCalledWith(
      1,
      {
        action: 'update',
        defaultValues: {
          guid: 'guid',
          mnemonic: 'EUR',
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
    jest.spyOn(apiHook, 'useCommodity').mockReturnValue(
      { data: { guid: 'guid', mnemonic: 'GOOGL', namespace: 'STOCK' } as Commodity } as UseQueryResult<Commodity>,
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
    jest.spyOn(apiHook, 'usePrices').mockReturnValue({ data: new PriceDBMap(prices) } as SWRResponse);
    render(<CommodityPage params={{ guid: 'guid' }} />);

    await screen.findByText('GOOGL');
    expect(PriceForm).toBeCalledWith(
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
        hideDefaults: true,
      },
      {},
    );
  });
});
