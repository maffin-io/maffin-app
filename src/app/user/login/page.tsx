'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
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
      <>
        Loading...
      </>
    );
  }

  return (
    <button
      className="btn btn-primary"
      type="button"
      onClick={() => { tokenClient.requestAccessToken(); }}
    >
      Sign In
    </button>
  );
}
