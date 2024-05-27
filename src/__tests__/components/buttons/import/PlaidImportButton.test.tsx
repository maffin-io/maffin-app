import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as plaidLink from 'react-plaid-link';
import type { AccountBase, TransactionsSyncResponse } from 'plaid';

import ImportButton from '@/components/buttons/import/PlaidImportButton';
import { DataSourceContext } from '@/hooks';
import * as actions from '@/app/actions';
import * as sessionHook from '@/hooks/useSession';
import * as plaidDTO from '@/lib/external/plaid';
import type { DataSourceContextType } from '@/hooks';

jest.mock('@/app/actions', () => ({
  __esModule: true,
  ...jest.requireActual('@/app/actions'),
}));

jest.mock('@/lib/external/plaid', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/external/plaid'),
}));

jest.mock('react-plaid-link', () => ({
  __esModule: true,
  ...jest.requireActual('react-plaid-link'),
}));

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

describe('PlaidImportButton', () => {
  beforeEach(() => {
    jest.spyOn(plaidLink, 'usePlaidLink').mockReturnValue({
      ready: true,
      open: jest.fn(),
      exit: jest.fn(),
      error: null,
    });
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      user: { sub: 'user-id' },
      roles: { isBeta: true },
    } as sessionHook.SessionReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty when not beta user', async () => {
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      roles: { isBeta: false },
    } as sessionHook.SessionReturn);

    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: false } as DataSourceContextType}>
        <ImportButton />
      </DataSourceContext.Provider>,
    );

    expect(container.outerHTML).toEqual('<div><span></span></div>');
  });

  it('disables button when datasource not available', async () => {
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: false } as DataSourceContextType}>
        <ImportButton />
      </DataSourceContext.Provider>,
    );

    const e = await screen.findByRole('button');
    expect(e).toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready and plaid link ready', async () => {
    render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <ImportButton />
      </DataSourceContext.Provider>,
    );

    const e = await screen.findByRole('button');
    expect(e).not.toBeDisabled();
  });

  it('creates link token and opens widget on click', async () => {
    const user = userEvent.setup();
    jest.spyOn(actions, 'createLinkToken').mockResolvedValue('link_token');
    const mockOpen = jest.fn();
    jest.spyOn(plaidLink, 'usePlaidLink').mockReturnValue({
      ready: true,
      open: mockOpen,
      exit: jest.fn(),
      error: null,
    });

    render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <ImportButton />
      </DataSourceContext.Provider>,
    );

    const importButton = await screen.findByRole('button');
    expect(mockOpen).not.toBeCalled();

    await user.click(importButton);

    expect(actions.createLinkToken).toBeCalledWith({ userId: 'user-id' });
    expect(mockOpen).toBeCalled();
    expect(plaidLink.usePlaidLink).nthCalledWith(
      2,
      {
        onSuccess: expect.any(Function),
        token: 'link_token',
      },
    );
  });

  it('retrieves transactions and creates entities on success', async () => {
    const user = userEvent.setup();
    const mockOnImport = jest.fn();

    jest.spyOn(actions, 'createLinkToken').mockResolvedValue('link_token');
    jest.spyOn(actions, 'createAccessToken').mockResolvedValue('access_token');
    jest.spyOn(actions, 'getTransactions').mockResolvedValue({
      accounts: [] as AccountBase[],
    } as TransactionsSyncResponse);
    jest.spyOn(plaidDTO, 'createEntitiesFromData').mockImplementation();

    render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <ImportButton onImport={mockOnImport} />
      </DataSourceContext.Provider>,
    );

    const importButton = await screen.findByRole('button');
    await user.click(importButton);
    const { onSuccess } = (plaidLink.usePlaidLink as jest.Mock).mock.calls[0][0];

    await onSuccess('public_token');

    expect(actions.createAccessToken).toBeCalledWith('public_token');
    expect(actions.getTransactions).toBeCalledWith('access_token');
    expect(plaidDTO.createEntitiesFromData).toBeCalledWith({
      accounts: [],
    });
    expect(mockOnImport).toBeCalled();
  });
});
