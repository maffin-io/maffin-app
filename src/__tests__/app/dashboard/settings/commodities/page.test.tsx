import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';

import * as apiHook from '@/hooks/api';
import CommoditiesPage from '@/app/dashboard/settings/commodities/page';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('CommoditiesPage', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: undefined } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when loading data', async () => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ isLoading: true } as SWRResponse);
    render(<CommoditiesPage />);

    await screen.findByTestId('Loading');
  });

  it('shows commodities by namespace', async () => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({
      data: [
        {
          guid: 'eur',
          mnemonic: 'EUR',
          namespace: 'CURRENCY',
        },
        {
          guid: 'googl',
          mnemonic: 'GOOGL',
          namespace: 'STOCK',
        },
        {
          guid: 'loy',
          mnemonic: 'EX_LOYALTY',
          namespace: 'CUSTOM',
          full_name: 'Loyalty points',
        },
      ],
    } as SWRResponse);

    const { container } = render(<CommoditiesPage />);

    screen.getByText('Currencies');
    screen.getByText('Investments');
    screen.getByText('Custom');
    expect(container).toMatchSnapshot();
  });
});
