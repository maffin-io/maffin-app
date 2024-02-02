'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import { useAuth0 } from '@auth0/auth0-react';

import Loading from '@/components/Loading';
import { isStaging } from '@/helpers/env';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [
    tokenClient,
    setTokenClient,
  ] = React.useState<google.accounts.oauth2.TokenClient | null>(null);

  React.useEffect(() => {
    setTokenClient(window.google.accounts?.oauth2.initTokenClient({
      client_id: '123339406534-gnk10bh5hqo87qlla8e9gmol1j961rtg.apps.googleusercontent.com',
      scope: 'email profile https://www.googleapis.com/auth/drive.file',
      callback: async (tokenResponse) => {
        localStorage.setItem('accessToken', tokenResponse.access_token);
        mutate('/api/user', null, { revalidate: true });
        router.push('/dashboard/accounts');
      },
    }));

    router.prefetch('/dashboard/investments');
    router.prefetch('/dashboard/accounts');
    router.prefetch('/dashboard/accounts/guid');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (tokenClient === null) {
    return (
      <Loading />
    );
  }

  console.log(isAuthenticated);
  // if (isStaging() || isAuthenticated) {
  //   router.push('/dashboard/accounts');
  // }

  return (
    <button
      className="btn btn-primary"
      type="button"
      onClick={() => {
        if (isStaging()) {
          router.push('/dashboard/accounts');
        } else {
          loginWithRedirect();
        }
      }}
    >
      Sign In
    </button>
  );
}
