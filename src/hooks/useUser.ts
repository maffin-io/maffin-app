import React from 'react';
import { useRouter } from 'next/navigation';

import useGapiClient from '@/hooks/useGapiClient';
import useApi from '@/hooks/useApi';
import type { User } from '@/types/user';

const emptyUser: User = {
  name: '',
  email: '',
  image: '',
  isLoggedIn: false,
};

export default function useUser(): { user: User } {
  const router = useRouter();
  const [isGapiLoaded] = useGapiClient();
  const { data: user } = useApi(isGapiLoaded ? '/api/user' : null);

  React.useEffect(() => {
    if (user && !user.isLoggedIn) {
      localStorage.setItem('accessToken', '');
      router.push('/user/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGapiLoaded, user]);

  if (!user) {
    return { user: emptyUser };
  }

  return { user };
}
