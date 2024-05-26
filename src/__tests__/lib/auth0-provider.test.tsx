import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as auth0 from '@auth0/auth0-react';

import Provider from '@/lib/auth0-provider';
import { Actions } from '@/app/actions';

jest.mock('@auth0/auth0-react', () => ({
  ...jest.requireActual('@auth0/auth0-react'),
  useAuth0: jest.fn().mockReturnValue({
    isAuthenticated: false,
    getAccessTokenSilently: jest.fn(),
  }),
  Auth0Provider: jest.fn((props: React.PropsWithChildren) => (
    <div data-testid="Auth0Provider">
      {props.children}
    </div>
  )),
}));

jest.mock('@/components/buttons/FormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="FormButton">
      {props.children}
    </div>
  ),
));

describe('Auth0Provider', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls provider with expected params', () => {
    render(<Provider />);

    expect(auth0.Auth0Provider).toBeCalledWith(
      {
        authorizationParams: {
          audience: 'https://maffin',
          connection: 'maffin-gcp',
          redirect_uri: 'http://localhost',
          scope: 'profile email',
        },
        children: expect.anything(),
        clientId: 'mMmnR4NbQOnim9B8QZfe9wfFuaKb8rwW',
        domain: 'maffin-dev.eu.auth0.com',
      },
      {},
    );
  });

  it('renders children', () => {
    render(<Provider>hello</Provider>);
    screen.getByText('hello');
  });

  it('stores access token into Actions', async () => {
    jest.spyOn(auth0, 'useAuth0').mockReturnValue({
      isAuthenticated: true,
      getAccessTokenSilently: jest.fn().mockResolvedValue('token') as Function,
    } as auth0.Auth0ContextInterface<auth0.User>);

    const mockSetter = jest.fn();
    Object.defineProperty(Actions, 'accessToken', {
      set: mockSetter,
    });

    render(<Provider />);

    await waitFor(() => expect(mockSetter).toBeCalledWith('token'));
  });
});
