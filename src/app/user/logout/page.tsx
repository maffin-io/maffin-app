'use client';

import React from 'react';
import Link from 'next/link';

export default function LogoutPage(): JSX.Element {
  React.useEffect(() => {
    localStorage.setItem('accessToken', '');
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
