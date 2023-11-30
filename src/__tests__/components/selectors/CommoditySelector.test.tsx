import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';

import Selector from '@/components/selectors/Selector';
import { Commodity } from '@/book/entities';
import { CommoditySelector } from '@/components/selectors';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/selectors/Selector', () => jest.fn(
  () => <div data-testid="Selector" />,
));

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
        placeholder: 'Choose commodity',
        getOptionLabel: expect.any(Function),
        getOptionValue: expect.any(Function),
        options: [],
      },
      {},
    );
  });

  it('filters by namespace', async () => {
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
        options: [options[2]],
      }),
      {},
    );
  });
});
