import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { User } from '@auth0/auth0-react';

import { isStaging } from '@/helpers/env';

const emptyUser: User = {
  name: '',
  email: '',
  picture: '',
};

export type SessionReturn = {
  accessToken: string,
  user: User;
};

/**
 * This hook captures Authorization data from Google Oauth2
 */
export default function useSession(): SessionReturn {
  const { user, isAuthenticated } = useAuth0();
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

    if (user && isAuthenticated) {
      load(user);
    }
  }, [user, isAuthenticated, setAccessToken]);

  return {
    accessToken,
    user: isStaging()
      ? { name: 'Maffin', email: 'iomaffin@gmail.com', picture: '' }
      : user || emptyUser,
  };
}
