import React from 'react';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';

import Selector from '@/components/selectors/Selector';
import { Commodity } from '@/book/entities';
import { CommoditySelector } from '@/components/selectors';

jest.mock('@/components/selectors/Selector', () => jest.fn(
  () => <div data-testid="Selector" />,
));

describe('CommoditySelector', () => {
  beforeEach(() => {
    jest.spyOn(Commodity, 'find').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <CommoditySelector />
      </SWRConfig>,
    );

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

  it('passes data as expected', async () => {
    const mockOnSave = jest.fn();
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <CommoditySelector
          id="customId"
          placeholder="My placeholder"
          isClearable={false}
          className="class"
          defaultValue={{ mnemonic: 'EUR' } as Commodity}
          onChange={mockOnSave}
        />
      </SWRConfig>,
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
    jest.spyOn(Commodity, 'find').mockResolvedValue(options);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <CommoditySelector />
      </SWRConfig>,
    );

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
    jest.spyOn(Commodity, 'find').mockResolvedValue(options);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <CommoditySelector
          ignoreNamespaces={['CURRENCY']}
        />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[2]],
      }),
      {},
    );
  });

  it('gets commodities once only', async () => {
    const { rerender } = render(
      <CommoditySelector />,
    );

    rerender(
      <CommoditySelector />,
    );

    await screen.findByTestId('Selector');
    expect(Commodity.find).toHaveBeenCalledTimes(1);
  });
});
