'use client';

import React from 'react';
import {
  Auth0Provider,
  useAuth0,
} from '@auth0/auth0-react';

import { Actions } from '@/app/actions';

export default function Provider({
  children,
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN as string}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID as string}
      authorizationParams={{
        redirect_uri: (typeof window !== 'undefined' && window.location.origin) || '',
        scope: process.env.NEXT_PUBLIC_AUTH0_SCOPES,
        connection: 'maffin-gcp',
        audience: 'https://maffin',
      }}
    >
      <AccessTokenActionProvider>{children}</AccessTokenActionProvider>
    </Auth0Provider>
  );
}

function AccessTokenActionProvider({
  children,
}: React.PropsWithChildren): React.JSX.Element {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  React.useEffect(() => {
    async function saveAccessToken() {
      const accessToken = await getAccessTokenSilently();
      Actions.accessToken = accessToken;
    }

    if (isAuthenticated) {
      saveAccessToken();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <span>
      {children}
    </span>
  );
}
