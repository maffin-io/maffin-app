'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import Loading from '@/components/Loading';
import { isStaging } from '@/helpers/env';
import { authorize } from '@/lib/Stocker';
import useSession from '@/hooks/useSession';

export default function LoginPage(): JSX.Element {
  const { setCredentials } = useSession();
  const router = useRouter();
  const [
    codeClient,
    setCodeClient,
  ] = React.useState<google.accounts.oauth2.CodeClient | null>(null);

  React.useEffect(() => {
    setCodeClient(window.google.accounts?.oauth2.initCodeClient({
      client_id: '123339406534-gnk10bh5hqo87qlla8e9gmol1j961rtg.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      ux_mode: 'popup',
      callback: async (response) => {
        const credentials = await authorize(response.code);
        setCredentials(credentials);
        router.push('/dashboard/accounts');
      },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (codeClient === null) {
    return (
      <Loading />
    );
  }

  return (
    <button
      className="btn btn-primary"
      type="button"
      onClick={() => {
        if (isStaging()) {
          router.push('/dashboard/accounts');
        } else {
          codeClient?.requestCode();
        }
      }}
    >
      Sign In
    </button>
  );
}
