import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import { UseQueryResult } from '@tanstack/react-query';

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
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: undefined } as UseQueryResult<Commodity[]>);
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
        namespace: 'STOCK',
      } as Commodity,
    ];
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Commodity[]>,
    );

    render(<CommoditySelector namespace="STOCK" />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[2]],
      }),
      {},
    );
  });

  it('filters by ignore', async () => {
    const options = [
      {
        guid: '1',
        mnemonic: 'EUR',
        namespace: 'CURRENCY',
      } as Commodity,
      {
        guid: '2',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity,
      {
        guid: '3',
        mnemonic: 'IDVY.AS',
        namespace: 'STOCK',
      } as Commodity,
    ];
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Commodity[]>,
    );

    render(<CommoditySelector ignore={['2', '3']} />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[0]],
      }),
      {},
    );
  });
});
