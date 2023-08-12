import React from 'react';
import { render, screen } from '@testing-library/react';
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

  it('renders as expected', async () => {
    const { container } = render(<CommoditySelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'commoditySelector',
        isClearable: true,
        defaultValue: undefined,
        className: '',
        labelAttribute: 'mnemonic',
        options: [],
        placeholder: 'Choose commodity',
        onChange: expect.any(Function),
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with no available commodities', async () => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: [] } as SWRResponse);
    render(<CommoditySelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'commoditySelector',
        isClearable: true,
        defaultValue: undefined,
        className: '',
        labelAttribute: 'mnemonic',
        options: [],
        placeholder: 'Choose commodity',
        onChange: expect.any(Function),
      },
      {},
    );
  });

  it('passes data as expected', async () => {
    const mockOnSave = jest.fn();
    const { container } = render(
      <CommoditySelector
        id="customId"
        placeholder="My placeholder"
        isClearable={false}
        className="class"
        defaultValue={{ mnemonic: 'EUR' } as Commodity}
        onChange={mockOnSave}
      />,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'customId',
        isClearable: false,
        defaultValue: { mnemonic: 'EUR' },
        className: 'class',
        labelAttribute: 'mnemonic',
        options: [],
        placeholder: 'My placeholder',
        onChange: mockOnSave,
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('loads commodities and passes as options', async () => {
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
        namespace: 'AS',
      } as Commodity,
    ];
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue(
      {
        data: options,
      } as SWRResponse,
    );

    render(<CommoditySelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options,
      }),
      {},
    );
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
        namespace: 'AS',
      } as Commodity,
    ];
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue(
      {
        data: options,
      } as SWRResponse,
    );

    render(
      <CommoditySelector
        ignoreNamespaces={['CURRENCY']}
      />,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[2]],
      }),
      {},
    );
  });
});
