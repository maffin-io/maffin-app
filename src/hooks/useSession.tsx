import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { User, Auth0ContextInterface } from '@auth0/auth0-react';

import { isStaging } from '@/helpers/env';

const emptyUser: User = {
  name: '',
  email: '',
  picture: '',
};

export type SessionReturn = {
  accessToken: string,
} & Auth0ContextInterface<User>;

/**
 * This hook captures Authorization data from Google Oauth2
 */
export default function useSession(): SessionReturn {
  const auth0 = useAuth0();
  const [accessToken, setAccessToken] = React.useState('');

  /**
   * Note that we have the accessToken attribute
   * in the user profile because we have a custom action
   * in Auth0 that adds it from user_metadata.
   */
  React.useEffect(() => {
    async function load(u: User) {
      setAccessToken(u.accessToken);
    }

    if (auth0.user && auth0.isAuthenticated) {
      load(auth0.user);
    }
  }, [auth0.user, auth0.isAuthenticated, setAccessToken]);

  return {
    ...auth0,
    accessToken,
    isAuthenticated: isStaging() ? true : auth0.isAuthenticated,
    isLoading: isStaging() ? false : auth0.isLoading,
    user: isStaging()
      ? { name: 'Maffin', email: 'iomaffin@gmail.com', picture: '' }
      : auth0.user || emptyUser,
  };
}
