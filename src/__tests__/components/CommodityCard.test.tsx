import React from 'react';
import { render, screen } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import * as apiHooks from '@/hooks/api';
import { PriceDBMap } from '@/book/prices';
import type { Commodity, Price } from '@/book/entities';
import CommodityCard from '@/components/CommodityCard';

jest.mock('@/hooks/api');

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

jest.mock('@/helpers/env', () => ({
  __esModule: true,
  get IS_PAID_PLAN() {
    return true;
  },
}));

describe('CommodityCard', () => {
  let eur: Commodity;
  beforeEach(() => {
    jest.spyOn(apiHooks, 'useCommodity').mockReturnValue({ data: undefined } as UseQueryResult<Commodity>);
    jest.spyOn(apiHooks, 'usePrices').mockReturnValue({ data: undefined } as UseQueryResult<PriceDBMap>);

    eur = {
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    } as Commodity;
    jest.spyOn(apiHooks, 'useMainCurrency').mockReturnValue({
      data: eur,
    } as UseQueryResult<Commodity>);
  });

  it('returns loading when no commodity', () => {
    jest.spyOn(apiHooks, 'usePrices').mockReturnValue({ data: {} } as UseQueryResult<PriceDBMap>);

    render(<CommodityCard guid="guid" />);

    screen.getByTestId('Loading');
  });

  it('returns loading when no prices', () => {
    jest.spyOn(apiHooks, 'useCommodity').mockReturnValue({ data: {} } as UseQueryResult<Commodity>);

    render(<CommodityCard guid="guid" />);

    screen.getByTestId('Loading');
  });

  it('renders as expected without warning when prices for CURRENCY', () => {
    jest.spyOn(apiHooks, 'useCommodity').mockReturnValue({
      data: {
        mnemonic: 'EUR',
        namespace: 'CURRENCY',
      },
    } as UseQueryResult<Commodity>);

    jest.spyOn(apiHooks, 'usePrices').mockReturnValue({
      data: {
        getPrice: (() => ({ guid: 'price' } as Price)) as PriceDBMap['getPrice'],
        getInvestmentPrice: (() => ({ guid: 'price' } as Price)) as PriceDBMap['getInvestmentPrice'],
      } as PriceDBMap,
    } as UseQueryResult<PriceDBMap>);

    const { container } = render(<CommodityCard guid="guid" />);

    screen.getByText('EUR');
    expect(container).toMatchSnapshot();
  });

  it.each([
    'STOCK', 'MUTUAL', 'OTHER',
  ])('renders as expected without warning when prices for non CURRENCY', (namespace) => {
    jest.spyOn(apiHooks, 'useCommodity').mockReturnValue({
      data: {
        mnemonic: 'MNE',
        namespace,
      },
    } as UseQueryResult<Commodity>);

    jest.spyOn(apiHooks, 'usePrices').mockReturnValue({
      data: {
        getPrice: (() => ({ guid: 'price' } as Price)) as PriceDBMap['getPrice'],
        getInvestmentPrice: (() => ({ guid: 'price' } as Price)) as PriceDBMap['getInvestmentPrice'],
      } as PriceDBMap,
    } as UseQueryResult<PriceDBMap>);

    render(<CommodityCard guid="guid" />);

    screen.getByText('MNE');
    expect(screen.queryByText('!')).toBeNull();
  });

  it.each([
    'CURRENCY', 'STOCK', 'MUTUAL', 'OTHER',
  ])('renders as expected without warning when prices for %s', (namespace) => {
    jest.spyOn(apiHooks, 'useCommodity').mockReturnValue({
      data: {
        mnemonic: 'MNE',
        namespace,
      },
    } as UseQueryResult<Commodity>);

    jest.spyOn(apiHooks, 'usePrices').mockReturnValue({
      data: {
        getPrice: (() => ({ guid: 'missing_price' } as Price)) as PriceDBMap['getPrice'],
        getInvestmentPrice: (() => ({ guid: 'missing_price' } as Price)) as PriceDBMap['getInvestmentPrice'],
      } as PriceDBMap,
    } as UseQueryResult<PriceDBMap>);

    render(<CommodityCard guid="guid" />);

    screen.getByText('MNE');
    screen.getByText('!');
  });
});
