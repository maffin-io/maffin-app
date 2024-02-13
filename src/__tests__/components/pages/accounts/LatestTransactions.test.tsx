import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { UseQueryResult } from '@tanstack/react-query';

import { LatestTransactions } from '@/components/pages/accounts';
import * as apiHook from '@/hooks/api';
import type { Transaction } from '@/book/entities';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('LatestTransactions', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useLatestTxs').mockReturnValue({ data: undefined } as UseQueryResult<Transaction[]>);
  });

  it('renders with empty txs', () => {
    const { container } = render(<LatestTransactions />);
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with txs', () => {
    jest.spyOn(apiHook, 'useLatestTxs').mockReturnValue({
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
                commodity: {
                  mnemonic: 'EUR',
                },
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
                commodity: {
                  mnemonic: 'SGD',
                },
              },
              quantity: -100,
            },
          ],
        },
      ],
    } as UseQueryResult<Transaction[]>);
    const { container } = render(<LatestTransactions />);

    screen.getByText('Account 1');
    screen.getByText('Account 2');
    expect(container).toMatchSnapshot();
  });

  it('picks the correct split when investment', () => {
    jest.spyOn(apiHook, 'useLatestTxs').mockReturnValue({
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
                guid: 'account2',
                name: 'Account 2',
                type: 'INVESTMENT',
                commodity: {
                  mnemonic: 'EUR',
                },
              },
              quantity: 100,
            },
            {
              account: {
                guid: 'account1',
                name: 'Account 1',
                type: 'ASSET',
                commodity: {
                  mnemonic: 'EUR',
                },
              },
              quantity: 100,
            },
          ],
        },
      ],
    } as UseQueryResult<Transaction[]>);
    const { container } = render(<LatestTransactions />);

    screen.getByText('Account 1');
    expect(container).toMatchSnapshot();
  });
});
