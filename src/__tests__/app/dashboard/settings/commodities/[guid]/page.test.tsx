import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';

import { Commodity } from '@/book/entities';
import CommodityPage from '@/app/dashboard/settings/commodities/[guid]/page';
import CommodityFormButton from '@/components/buttons/CommodityFormButton';
import * as apiHook from '@/hooks/api';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

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
    const { container } = render(<CommodityPage params={{ guid: 'guid' }} />);

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
    expect(container).toMatchSnapshot();
  });
});
