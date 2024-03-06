import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import AccountPage from '@/app/dashboard/accounts/[guid]/page';
import { Account } from '@/book/entities';
import * as apiHook from '@/hooks/api';
import {
  Header,
  IEInfo,
  AssetInfo,
  InvestmentInfo,
} from '@/components/pages/account';
import { TransactionsTable } from '@/components/tables';

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/pages/account/Header', () => jest.fn(
  () => <div data-testid="Header" />,
));

jest.mock('@/components/tables/TransactionsTable', () => jest.fn(
  () => <div data-testid="TransactionsTable" />,
));

jest.mock('@/components/pages/account/IEInfo', () => jest.fn(
  () => <div data-testid="IEInfo" />,
));

jest.mock('@/components/pages/account/InvestmentInfo', () => jest.fn(
  () => <div data-testid="InvestmentInfo" />,
));

jest.mock('@/components/pages/account/AssetInfo', () => jest.fn(
  () => <div data-testid="AssetInfo" />,
));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

describe('AccountPage', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useAccount').mockReturnValue({ data: undefined } as UseQueryResult<Account>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading while accounts is empty', async () => {
    jest.spyOn(apiHook, 'useAccount').mockReturnValue({ isLoading: true } as UseQueryResult<Account>);
    const { container } = render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('Loading');
    expect(Header).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('displays message when account not found', async () => {
    render(<AccountPage params={{ guid: 'guid' }} />);

    screen.getByText('does not exist', { exact: false });
    expect(Header).toHaveBeenCalledTimes(0);
    expect(TransactionsTable).toHaveBeenCalledTimes(0);
  });

  it('renders as expected with account', async () => {
    const account = {
      guid: 'guid',
      path: 'path',
      type: 'TYPE',
      parentId: 'parent',
      commodity: {
        mnemonic: 'EUR',
      },
    } as Account;

    jest.spyOn(apiHook, 'useAccount').mockReturnValueOnce({ data: account } as UseQueryResult<Account>);

    const { container } = render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('TransactionsTable');
    expect(Header).toBeCalledWith({ account }, {});
    expect(TransactionsTable).toHaveBeenLastCalledWith(
      {
        account,
      },
      {},
    );
    expect(IEInfo).toHaveBeenLastCalledWith(
      {
        account,
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('shows investment info when account is stock', async () => {
    const account = {
      guid: 'guid',
      path: 'path',
      type: 'INVESTMENT',
      commodity: {
        mnemonic: 'GOOGL',
      },
      parentId: 'parent',
    } as Account;

    jest.spyOn(apiHook, 'useAccount').mockReturnValueOnce({ data: account } as UseQueryResult<Account>);

    render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('InvestmentInfo');
    expect(InvestmentInfo).toHaveBeenLastCalledWith(
      {
        account,
      },
      {},
    );
  });

  it('shows asset info when account is asset', async () => {
    const account = {
      guid: 'guid',
      path: 'path',
      type: 'ASSET',
      commodity: {
        mnemonic: 'EUR',
      },
      parentId: 'parent',
    } as Account;

    jest.spyOn(apiHook, 'useAccount').mockReturnValueOnce({ data: account } as UseQueryResult<Account>);

    render(<AccountPage params={{ guid: 'guid' }} />);

    await screen.findByTestId('AssetInfo');
    expect(AssetInfo).toHaveBeenLastCalledWith(
      {
        account,
      },
      {},
    );
  });
});
