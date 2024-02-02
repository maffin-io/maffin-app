'use client';

import React from 'react';
import Link from 'next/link';

import useSession from '@/hooks/useSession';

export default function LogoutPage(): JSX.Element {
  const { revoke } = useSession();

  React.useEffect(() => {
    revoke();
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
