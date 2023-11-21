import React from 'react';
import {
  render,
} from '@testing-library/react';

import { Commodity } from '@/book/entities';
import CommodityPage from '@/app/dashboard/settings/commodities/[guid]/page';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('CommodityPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when loading data', async () => {
    jest.spyOn(Commodity, 'findOneByOrFail').mockResolvedValue({ mnemonic: 'EUR ' } as Commodity);
    const { container } = render(<CommodityPage params={{ guid: 'guid' }} />);

    expect(container).toMatchSnapshot();
  });
});
