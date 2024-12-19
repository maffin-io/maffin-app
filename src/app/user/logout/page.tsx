'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';

export default function LogoutPage(): React.JSX.Element {
  const { logout } = useAuth0();

  React.useEffect(() => {
    logout({
      logoutParams: {
        returnTo: (
          typeof window !== 'undefined' && `${window.location.origin}/user/login`
        ) || '',
      },
    });
  });

  return (
    <div className="text-center">
      <p>See you soon!</p>

      <Link
        href="/user/login"
      >
        <b>Log In again</b>
      </Link>
    </div>
  );
}
