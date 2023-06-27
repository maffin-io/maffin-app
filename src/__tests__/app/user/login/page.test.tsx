import React from 'react';
import { render, screen } from '@testing-library/react';

import LoginPage from '@/app/user/login/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');

describe('LoginPage', () => {
  let requestAccessToken: jest.Mock;
  let mockInitTokenClient: jest.Mock;
  let mockStorageSetItem: jest.SpyInstance;
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    requestAccessToken = jest.fn();
    mockInitTokenClient = jest.fn().mockReturnValue({
      requestAccessToken,
    }) as jest.Mock<typeof window.google.accounts.oauth2.initTokenClient>;
    window.google = {
      accounts: {
        // @ts-ignore
        oauth2: {
          initTokenClient: mockInitTokenClient,
        } as typeof window.google.accounts.oauth2,
      } as typeof window.google.accounts,
    };
    mockStorageSetItem = jest.spyOn(Storage.prototype, 'setItem');
    mockRouterPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockRouterPush,
    }));
  });

  it('shows loading... when not finished', () => {
    const { container } = render(<LoginPage />);
    expect(container).toMatchSnapshot();
  });

  it('calls requestAcessToken when clicking sign in button', async () => {
    render(<LoginPage />);

    expect(mockInitTokenClient).toHaveBeenCalledWith({
      callback: expect.any(Function),
      client_id: '123339406534-gnk10bh5hqo87qlla8e9gmol1j961rtg.apps.googleusercontent.com',
      scope: 'email profile https://www.googleapis.com/auth/drive.file',
    });

    expect(requestAccessToken).toBeCalledTimes(0);
    screen.getByText('Sign In').click();
    expect(requestAccessToken).toBeCalledTimes(1);
  });

  it('callback saves access token to storage and navigates to accounts page', async () => {
    render(<LoginPage />);

    const { callback } = mockInitTokenClient.mock.calls[0][0];
    await callback({ access_token: 'ACCESS_TOKEN' });

    expect(mockStorageSetItem).toHaveBeenNthCalledWith(
      1,
      'accessToken',
      'ACCESS_TOKEN',
    );
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/accounts');
  });
});
