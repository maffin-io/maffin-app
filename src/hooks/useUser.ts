import React from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

import useGapiClient from '@/hooks/useGapiClient';

type User = {
  name: string,
  email: string,
  image: string,
  isLoggedIn: boolean,
};

const emptyUser = {
  name: '',
  email: '',
  image: '',
  isLoggedIn: false,
};

async function getUser(): Promise<User> {
  const res = await window.gapi.client.people.people.get({
    resourceName: 'people/me',
    personFields: 'names,emailAddresses,photos',
  });

  return {
    name: res.result.names?.[0].displayName as string,
    email: res.result.emailAddresses?.[0].value as string,
    image: res.result.photos?.[0].url as string,
    isLoggedIn: true,
  };
}

export default function useUser(): { user: User } {
  const router = useRouter();
  const [isGapiLoaded] = useGapiClient();
  const { data: user, error } = useSWR<User>(isGapiLoaded ? '/api/user' : null, getUser);

  React.useEffect(() => {
    if (error) {
      router.push('/user/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGapiLoaded, user, error]);

  if (!user) {
    return { user: emptyUser };
  }

  return { user };
}
