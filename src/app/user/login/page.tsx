'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';

import { isStaging } from '@/helpers/env';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { isAuthenticated, loginWithPopup } = useAuth0();

  React.useEffect(() => {
    if (isStaging() || isAuthenticated) {
      router.push('/dashboard/accounts');
    }
  }, [isAuthenticated, router]);

  return (
    <button
      className="btn btn-primary"
      type="button"
      onClick={() => {
        if (!isStaging()) {
          loginWithPopup();
        }
      }}
    >
      Sign In
    </button>
  );
}
