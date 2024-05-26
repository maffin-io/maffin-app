'use client';

import React from 'react';
import {
  Auth0Provider,
  useAuth0,
} from '@auth0/auth0-react';

import { Actions } from '@/app/actions';
import { CONFIG } from '@/helpers/env';

export default function Provider({
  children,
}: React.PropsWithChildren): JSX.Element {
  return (
    <Auth0Provider
      domain={CONFIG.auth0.domain}
      clientId={CONFIG.auth0.clientId}
      authorizationParams={{
        redirect_uri: (typeof window !== 'undefined' && window.location.origin) || '',
        scope: CONFIG.auth0.scopes,
        connection: 'maffin-gcp',
        audience: 'https://premium',
      }}
    >
      <AccessTokenActionProvider>{children}</AccessTokenActionProvider>
    </Auth0Provider>
  );
}

function AccessTokenActionProvider({
  children,
}: React.PropsWithChildren): JSX.Element {
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
