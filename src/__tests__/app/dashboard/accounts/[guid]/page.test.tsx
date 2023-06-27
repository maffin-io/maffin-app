import React from 'react';
import {
  act,
  render,
  screen,
} from '@testing-library/react';
import type { DataSource } from 'typeorm';

import AccountPage from '@/app/dashboard/accounts/[guid]/page';
import { TransactionsTableProps } from '@/components/TransactionsTable';
import { Account } from '@/book/entities';
import * as queries from '@/book/queries';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('@/components/TransactionsTable', () => {
  function TransactionsTable(props: TransactionsTableProps) {
    return (
      <div className="TransactionsTable">
        <span>{JSON.stringify(props)}</span>
      </div>
    );
  }

  return TransactionsTable;
});

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');

describe('AccountPage', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockRouterPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockRouterPush,
    }));
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      {
        guid: 'guid',
        path: 'path',
        type: 'TYPE',
      } as Account,
    ]);
  });

  it('displays loading while account is null', () => {
    jest.spyOn(Account, 'findOneBy').mockResolvedValue(null);
    const { container } = render(<AccountPage params={{ guid: 'guid' }} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('returns 404 when account not found', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    jest.spyOn(Account, 'findOneBy').mockResolvedValue(null);

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      render(
        <AccountPage params={{ guid: 'guid' }} />,
      );
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/404');
  });

  it('renders as expected with account', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    jest.spyOn(Account, 'findOneBy').mockResolvedValue({
      guid: 'accountGuid',
      name: 'Account name',
      path: 'account:name',
      commodity: {
        mnemonic: 'EUR',
      },
    } as Account);

    let container;
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      ({ container } = render(
        <AccountPage params={{ guid: 'guid' }} />,
      ));
    });

    expect(container).toMatchSnapshot();
  });
});
