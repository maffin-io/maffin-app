import React from 'react';
import {
  act,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';

import Selector from '@/components/selectors/Selector';
import { Commodity } from '@/book/entities';
import { CommoditySelector } from '@/components/selectors';
import * as apiHook from '@/hooks/api';
import * as stocker from '@/apis/Stocker';

jest.mock('@/components/selectors/Selector', () => jest.fn(
  () => <div data-testid="Selector" />,
));

jest.mock('@/apis/Stocker', () => ({
  __esModule: true,
  ...jest.requireActual('@/apis/Stocker'),
}));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('CommoditySelector', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Selector with defaults', async () => {
    const option = { label: 'EUR', value: 'EUR' };
    // @ts-ignore
    jest.spyOn(Commodity, 'create').mockReturnValue({ mnemonic: option.value, namespace: 'UNKNOWN' });

    render(<CommoditySelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'commoditySelector',
        cacheOptions: true,
        creatable: true,
        isLoading: false,
        defaultOptions: [],
        loadOptions: expect.any(Function),
        placeholder: 'Choose commodity',
        getOptionLabel: expect.any(Function),
        getOptionValue: expect.any(Function),
      },
      {},
    );

    expect((Selector as jest.Mock).mock.calls[0][0].getOptionLabel(option)).toEqual('UNKNOWN: EUR');
    expect((Selector as jest.Mock).mock.calls[0][0].getOptionValue(option)).toEqual(undefined);
  });

  it('filters commodities', async () => {
    const options = [
      {
        mnemonic: 'EUR',
        namespace: 'CURRENCY',
      } as Commodity,
      {
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity,
      {
        mnemonic: 'IDVY.AS',
        namespace: 'EQUITY',
      } as Commodity,
    ];
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue(
      {
        data: options,
      } as SWRResponse,
    );

    render(<CommoditySelector namespace="EQUITY" />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultOptions: [options[2]],
      }),
      {},
    );
  });

  it('getOptionLabel works with already existing options', async () => {
    const c1 = new Commodity();
    c1.mnemonic = 'EUR';
    c1.namespace = 'CURRENCY';
    const commodities = [c1];
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: commodities } as SWRResponse);

    render(<CommoditySelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultOptions: commodities,
      }),
      {},
    );

    const { getOptionLabel } = (Selector as jest.Mock).mock.calls[0][0];
    expect(getOptionLabel(c1)).toEqual('EUR');
  });

  describe('loadOptions', () => {
    let commodity: Commodity;
    beforeEach(() => {
      commodity = new Commodity();
      commodity.mnemonic = 'EUR';
      commodity.namespace = 'CURRENCY';
      jest.spyOn(stocker, 'search').mockImplementation();
    });

    it('returns default option without calling Stocker when exact match', async () => {
      jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: [commodity] } as SWRResponse);

      render(<CommoditySelector />);

      const { loadOptions } = (Selector as jest.Mock).mock.calls[0][0];
      await act(async () => {
        const options = await loadOptions('eur');
        expect(options).toEqual([commodity]);
      });

      expect(stocker.search).not.toBeCalled();
    });

    it('returns matching options and Stocker result', async () => {
      jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: [commodity] } as SWRResponse);
      const stockerCommodity = {
        mnemonic: 'EU',
        namespace: 'EQUITY',
        fullname: 'name',
      };
      jest.spyOn(stocker, 'search').mockResolvedValue({
        ticker: stockerCommodity.mnemonic,
        namespace: stockerCommodity.namespace,
        name: stockerCommodity.fullname,
      });
      // @ts-ignore
      jest.spyOn(Commodity, 'create').mockReturnValue(stockerCommodity);

      render(<CommoditySelector />);

      const { loadOptions } = (Selector as jest.Mock).mock.calls[0][0];
      await act(async () => {
        const options = await loadOptions('e');
        expect(options).toEqual([
          commodity,
          stockerCommodity,
        ]);
      });

      expect(stocker.search).toBeCalledTimes(1);
      expect(stocker.search).toBeCalledWith('e', undefined);
    });

    it('calls stocker with namespace', async () => {
      jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: [commodity] } as SWRResponse);
      const stockerCommodity = {
        mnemonic: 'EU',
        namespace: 'EQUITY',
        fullname: 'name',
      };
      jest.spyOn(stocker, 'search').mockResolvedValue({
        ticker: stockerCommodity.mnemonic,
        namespace: stockerCommodity.namespace,
        name: stockerCommodity.fullname,
      });
      // @ts-ignore
      jest.spyOn(Commodity, 'create').mockReturnValue(stockerCommodity);

      render(<CommoditySelector namespace="EQUITY" />);

      const { loadOptions } = (Selector as jest.Mock).mock.calls[0][0];
      await act(async () => {
        await loadOptions('e');
      });

      expect(stocker.search).toBeCalledWith('e', 'EQUITY');
    });

    it('debounces Stocker searches', async () => {
      jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: [commodity] } as SWRResponse);
      const stockerCommodity = {
        mnemonic: 'EU',
        namespace: 'EQUITY',
        fullname: 'name',
      };
      jest.spyOn(stocker, 'search').mockResolvedValue({
        ticker: stockerCommodity.mnemonic,
        namespace: stockerCommodity.namespace,
        name: stockerCommodity.fullname,
      });
      // @ts-ignore
      jest.spyOn(Commodity, 'create').mockReturnValue(stockerCommodity);

      render(<CommoditySelector />);

      const { loadOptions } = (Selector as jest.Mock).mock.calls[0][0];
      await act(async () => {
        await Promise.all([
          loadOptions('e'),
          loadOptions('eu'),
        ]);
      });

      await waitFor(() => expect(stocker.search).toBeCalledTimes(1));
      expect(stocker.search).toBeCalledWith('eu', undefined);
    });
  });
});
