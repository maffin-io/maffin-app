import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';

import AmountField from '@/components/forms/transaction/AmountField';
import { Account, Commodity } from '@/book/entities';

describe('AmountField', () => {
  it('shows 0 when no splits', () => {
    render(
      <AmountField
        fromAccount={
          {
            guid: '',
            type: '',
            path: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        splits={[]}
      />,
    );

    const element = screen.getByText(/0\.00.*/);
    expect(element).toMatchSnapshot();
  });

  it('shows 0 when no toAccount in split', () => {
    render(
      <AmountField
        fromAccount={
          {
            guid: '',
            type: '',
            path: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        splits={[
          {
            amount: 200,
            toAccount: {
              guid: '',
              type: '',
              path: '',
              commodity: {
                mnemonic: 'EUR',
              } as Commodity,
            } as Account,
          },
        ]}
      />,
    );

    const element = screen.getByText(/0\.00.*/);
    expect(element).toMatchSnapshot();
  });

  it('shows 0 when no amount in split', () => {
    render(
      <AmountField
        fromAccount={
          {
            guid: '',
            type: '',
            path: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        splits={[
          {
            amount: NaN,
            toAccount: {
              guid: '',
              type: '',
              path: '',
              commodity: {
                mnemonic: 'EUR',
              } as Commodity,
            } as Account,
          },
        ]}
      />,
    );

    const element = screen.getByText(/0\.00.*/);
    expect(element).toMatchSnapshot();
  });

  it('adds split inverse amounts with negative result', () => {
    render(
      <AmountField
        fromAccount={
          {
            guid: '',
            type: '',
            path: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        splits={[
          {
            amount: -100.40,
            toAccount: {
              guid: 'split1',
              type: '',
              path: '',
              commodity: {
                mnemonic: 'EUR',
              } as Commodity,
            } as Account,
          },
          {
            amount: 200.20,
            toAccount: {
              guid: 'split2',
              type: '',
              path: '',
              commodity: {
                mnemonic: 'EUR',
              } as Commodity,
            } as Account,
          },
        ]}
      />,
    );

    const element = screen.getByText(/-99\.80.*/);
    expect(element).toMatchSnapshot();
  });

  it('adds split inverse amounts with positive result', () => {
    render(
      <AmountField
        fromAccount={
          {
            guid: '',
            type: '',
            path: '',
            commodity: {
              mnemonic: 'EUR',
            } as Commodity,
          } as Account
        }
        splits={[
          {
            amount: 100.40,
            toAccount: {
              guid: 'split1',
              type: '',
              path: '',
              commodity: {
                mnemonic: 'EUR',
              } as Commodity,
            } as Account,
          },
          {
            amount: -200.20,
            toAccount: {
              guid: 'split2',
              type: '',
              path: '',
              commodity: {
                mnemonic: 'EUR',
              } as Commodity,
            } as Account,
          },
        ]}
      />,
    );

    const element = screen.getByText(/99\.80.*/);
    expect(element).toMatchSnapshot();
  });
});
