import React from 'react';
import { act, render, screen } from '@testing-library/react';
import * as navigation from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import * as Stocker from '@/lib/Stocker';
import LoginPage from '@/app/user/login/page';
import * as helpers_env from '@/helpers/env';
import * as sessionHook from '@/hooks/useSession';
import type { Credentials } from '@/types/user';

jest.mock('swr');

jest.mock('next/navigation');

jest.mock('@/lib/Stocker', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/Stocker'),
}));

jest.mock('@/helpers/env', () => ({
  __esModule: true,
  isStaging: () => false,
}));

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

describe('LoginPage', () => {
  let requestCode: jest.Mock;
  let mockInitCodeClient: jest.Mock;
  let mockSetCredentials: jest.Mock<React.Dispatch<React.SetStateAction<Credentials>>>;
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    requestCode = jest.fn();
    mockInitCodeClient = jest.fn().mockReturnValue({
      requestCode,
    }) as jest.Mock<typeof window.google.accounts.oauth2.initCodeClient>;
    window.google = {
      accounts: {
        // @ts-ignore
        oauth2: {
          initCodeClient: mockInitCodeClient,
        } as typeof window.google.accounts.oauth2,
      } as typeof window.google.accounts,
    };
    mockRouterPush = jest.fn();
    jest.spyOn(navigation, 'useRouter').mockImplementation(() => ({
      push: mockRouterPush as AppRouterInstance['push'],
    } as AppRouterInstance));

    mockSetCredentials = jest.fn();
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      session: undefined,
      setCredentials: mockSetCredentials as React.Dispatch<
      React.SetStateAction<Credentials | undefined> >,
    } as sessionHook.SessionReturn);
  });

  it('shows loading... when not finished', () => {
    const { container } = render(<LoginPage />);
    expect(container).toMatchSnapshot();
  });

  it('calls requestCode when clicking sign in button', async () => {
    render(<LoginPage />);

    expect(mockInitCodeClient).toHaveBeenCalledWith({
      callback: expect.any(Function),
      client_id: '123339406534-gnk10bh5hqo87qlla8e9gmol1j961rtg.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      ux_mode: 'popup',
    });

    expect(requestCode).toBeCalledTimes(0);
    screen.getByText('Sign In').click();
    expect(requestCode).toBeCalledTimes(1);
  });

  it('callback authorizes, saves session to storage and navigates to accounts page', async () => {
    const credentials = {
      access_token: 'access_token',
      id_token: 'id_token',
      refresh_token: 'refresh_token',
      expiry_date: 123,
      scope: '',
      token_type: '',
    };
    jest.spyOn(Stocker, 'authorize').mockResolvedValue(credentials);

    render(<LoginPage />);

    const { callback } = mockInitCodeClient.mock.calls[0][0];
    await act(async () => callback({ code: 'CODE' }));

    expect(Stocker.authorize).toBeCalledWith('CODE');
    expect(mockSetCredentials).toHaveBeenNthCalledWith(
      1,
      credentials,
    );
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/accounts');
  });

  it('does not call requestCode when clicking sign in button and sends to /home/dashboard when staging', async () => {
    jest.spyOn(helpers_env, 'isStaging').mockReturnValue(true);
    render(<LoginPage />);

    expect(mockInitCodeClient).toHaveBeenCalledWith({
      callback: expect.any(Function),
      client_id: '123339406534-gnk10bh5hqo87qlla8e9gmol1j961rtg.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      ux_mode: 'popup',
    });

    screen.getByText('Sign In').click();
    expect(requestCode).toBeCalledTimes(0);
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/accounts');
    process.env.NEXT_PUBLIC_ENV = '';
  });
});
