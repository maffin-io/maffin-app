'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';

import { AuthError } from '@/helpers/errors';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { isAuthenticated, loginWithPopup, error } = useAuth0();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard/accounts');
    }
  }, [isAuthenticated, router]);

  if (error) {
    if (error.message === 'INVALID_SUBSCRIPTION') {
      new AuthError(error.message, error.message).show();
    } else {
      new AuthError(error.message, 'UNKNOWN').show();
    }
  }

  return (
    <button
      className="btn btn-primary"
      type="button"
      onClick={() => {
        loginWithPopup();
      }}
    >
      Sign In
    </button>
  );
}
