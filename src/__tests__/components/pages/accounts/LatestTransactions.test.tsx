import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { SWRResponse } from 'swr';

import { LatestTransactions } from '@/components/pages/accounts';
import * as apiHook from '@/hooks/useApi';

jest.mock('@/hooks/useApi', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useApi'),
}));

describe('LatestTransactions', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'default').mockReturnValue({ data: undefined } as SWRResponse);
  });

  it('renders with empty txs', () => {
    const { container } = render(<LatestTransactions />);

    screen.getByText('You have no movements yet...');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with txs', () => {
    jest.spyOn(apiHook, 'default').mockReturnValue({
      data: [
        {
          description: 'tx 1',
          date: DateTime.fromISO('2023-01-01'),
          currency: {
            mnemonic: 'EUR',
          },
          splits: [
            {
              account: {
                guid: 'account1',
                name: 'Account 1',
                type: 'ASSET',
              },
              quantity: 100,
            },
          ],
        },
        {
          description: 'tx 2',
          date: DateTime.fromISO('2023-01-02'),
          currency: {
            mnemonic: 'EUR',
          },
          splits: [
            {
              account: {
                guid: 'account2',
                name: 'Account 2',
                type: 'ASSET',
              },
              quantity: -100,
            },
          ],
        },
      ],
    } as SWRResponse);
    const { container } = render(<LatestTransactions />);

    screen.getByText('Account 1');
    screen.getByText('Account 2');
    expect(container).toMatchSnapshot();
  });
});
