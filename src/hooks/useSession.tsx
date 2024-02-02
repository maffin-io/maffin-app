import React from 'react';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';

import { refresh } from '@/lib/Stocker';
import type { Credentials, User } from '@/types/user';
import { isStaging } from '@/helpers/env';

const emptyUser: User = {
  name: '',
  email: '',
  image: '',
};

export type SessionReturn = {
  session: Credentials | undefined;
  user: User;
  setCredentials: React.Dispatch<React.SetStateAction<Credentials | undefined>>;
  revoke: Function;
};

/**
 * This hook captures Authorization data from Google Oauth2
 */
export default function useSession(): SessionReturn {
  const router = useRouter();
  const [credentials, setCredentials] = React.useState<Credentials>();

  /**
   * Once the first render is finished, try to load
   * the session from local storage.
   *
   * If it does not exist, redirect to /user/login.
   * If it exists, set local state credentials.
   */
  React.useEffect(() => {
    const strSession = localStorage.getItem('session');
    if (strSession) {
      setCredentials(JSON.parse(strSession));
    } else if (!isStaging()) {
      router.push('/user/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Set local storage session whenever local credentials state changes
   */
  React.useEffect(() => {
    if (credentials) {
      localStorage.setItem('session', JSON.stringify(credentials));
    }
  }, [credentials]);

  /**
   * Check every 10 seconds if the access token has expired.
   * If it has, then refresh the token.
   */
  React.useEffect(() => {
    let timer: number;

    async function check(c: Credentials) {
      await refreshIfExpired(c, setCredentials);
      timer = window.setInterval(async () => {
        await refreshIfExpired(c, setCredentials);
      }, 10000);
    }

    if (credentials) {
      check(credentials);
    }

    return () => clearInterval(timer);
  }, [credentials]);

  return {
    session: credentials,
    user: isStaging()
      ? { name: 'Maffin', email: 'iomaffin@gmail.com', image: '' }
      : extractUser(credentials?.id_token),
    setCredentials,
    revoke: () => {
      localStorage.removeItem('session');
      router.push('/user/login');
    },
  };
}

async function refreshIfExpired(
  credentials: Credentials,
  setCredentials: React.Dispatch<React.SetStateAction<Credentials | undefined>>,
) {
  const msLeft = credentials.expiry_date - DateTime.now().toMillis();
  if (msLeft <= 0) {
    const newCredentials = await refresh(credentials.refresh_token);
    setCredentials({
      ...newCredentials,
      // id_token is missing profile information when credentials
      // are returned from a refresh call
      id_token: credentials.id_token,
    });
  }
}

function extractUser(token?: string) {
  if (!token) {
    return emptyUser;
  }

  // Theoretically wrong but works for our use case
  // https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
  const data = JSON.parse(atob(token.split('.')[1]));

  return {
    name: data.name || '',
    email: data.email || '',
    image: data.picture || '',
  };
}
