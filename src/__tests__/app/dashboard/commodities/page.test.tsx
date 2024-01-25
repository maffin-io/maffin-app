import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import type { SWRResponse } from 'swr';

import * as apiHook from '@/hooks/api';
import CommoditiesPage from '@/app/dashboard/commodities/page';
import FormButton from '@/components/buttons/FormButton';
import CommodityForm from '@/components/forms/commodity/CommodityForm';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

jest.mock('@/components/buttons/FormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="FormButton">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/commodity/CommodityForm', () => jest.fn(
  () => <div data-testid="CommodityForm" />,
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

  it('renders as expected', async () => {
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
          namespace: 'OTHER',
          full_name: 'Loyalty points',
        },
      ],
    } as SWRResponse);

    const { container } = render(<CommoditiesPage />);

    screen.getByText('Currencies');
    screen.getByText('Financial');
    screen.getByText('Other');

    expect(FormButton).toBeCalledWith(
      expect.objectContaining({
        modalTitle: 'Add commodity',
        id: 'add-commodity',
      }),
      {},
    );
    expect(CommodityForm).toBeCalledWith(
      {},
      {},
    );
    expect(container).toMatchSnapshot();
  });
});
