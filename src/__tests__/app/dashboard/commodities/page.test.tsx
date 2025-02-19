import React from 'react';
import {
  screen,
  render,
} from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import * as apiHook from '@/hooks/api';
import CommoditiesPage from '@/app/dashboard/commodities/page';
import FormButton from '@/components/buttons/FormButton';
import CommodityForm from '@/components/forms/commodity/CommodityForm';
import type { Commodity } from '@/book/entities';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

jest.mock('@/components/CommodityCard', () => jest.fn(
  () => <div data-testid="CommodityCard" />,
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
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: undefined } as UseQueryResult<Commodity[]>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when loading data', async () => {
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ isLoading: true } as UseQueryResult<Commodity[]>);
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
    } as UseQueryResult<Commodity[]>);

    const { container } = render(<CommoditiesPage />);

    screen.getByText('Currencies');
    screen.getByText('Financial');
    screen.getByText('Other');

    expect(FormButton).toBeCalledWith(
      expect.objectContaining({
        modalTitle: 'Add commodity',
        id: 'add-commodity',
      }),
      undefined,
    );
    expect(CommodityForm).toBeCalledWith(
      {
        onSave: expect.any(Function),
      },
      undefined,
    );
    expect(container).toMatchSnapshot();
  });
});
