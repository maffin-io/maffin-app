import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { User, Auth0ContextInterface } from '@auth0/auth0-react';

import { getRoles } from '@/lib/jwt';

const emptyUser: User = {
  name: '',
  email: '',
  picture: '',
};

export type SessionReturn = {
  accessToken: string,
  roles: {
    isPremium: boolean,
    isBeta: boolean,
  },
} & Auth0ContextInterface<User>;

/**
 * This hook captures Authorization data from Google Oauth2
 */
export default function useSession(): SessionReturn {
  const auth0 = useAuth0();
  const [googleAccessToken, setGoogleAccessToken] = React.useState('');
  const [roles, setRoles] = React.useState({
    isPremium: false,
    isBeta: false,
  });

  /**
   * Note that we have the google accessToken attribute
   * in the user profile because we have a custom action
   * in Auth0 that adds it from user_metadata.
   */
  React.useEffect(() => {
    async function load(u: User) {
      setGoogleAccessToken(u.accessToken);
    }

    if (auth0.user && auth0.isAuthenticated) {
      load(auth0.user);
    }
  }, [auth0.user, auth0.isAuthenticated, setGoogleAccessToken]);

  /**
   * This is only for UI purposes and shouldn't be used as
   * a way to secure access to private resources as it is client side.
   *
   * The server resources are protected server side by verifying the
   * token server side.
   */
  React.useEffect(() => {
    async function load() {
      const accessToken = await auth0.getAccessTokenSilently();
      setRoles(await getRoles(accessToken));
    }

    if (auth0.isAuthenticated) {
      load();
    }
  }, [auth0]);

  return {
    ...auth0,
    accessToken: googleAccessToken,
    isAuthenticated: auth0.isAuthenticated,
    isLoading: auth0.isLoading,
    roles,
    user: auth0.user || emptyUser,
  };
}
