import React from 'react';
import { useRouter } from 'next/navigation';

import { useUser as useApiUser } from '@/hooks/api';
import type { User } from '@/types/user';

const emptyUser: User = {
  name: '',
  email: '',
  image: '',
  isLoggedIn: false,
};

export default function useUser(): { user: User } {
  const router = useRouter();
  const { data: user } = useApiUser();

  React.useEffect(() => {
    if (user && !user.isLoggedIn) {
      localStorage.setItem('accessToken', '');
      router.push('/user/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return { user: emptyUser };
  }

  return { user };
}
