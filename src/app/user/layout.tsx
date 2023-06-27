'use client';

import React from 'react';
import Image from 'next/image';

import Footer from '@/layout/Footer';
import maffinLogo from '@/assets/images/maffin_logo_sm.png';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  React.useEffect(() => {
    if (document.body) document.body.classList.add('authentication-bg');

    return () => {
      if (document.body) document.body.classList.remove('authentication-bg');
    };
  }, []);

  return (
    <>
      <div className="flex h-screen place-content-center place-items-center">
        <div className="flex p-6 bg-gunmetal-700 items-center rounded-md">
          <Image className="m-0" src={maffinLogo} alt="" height="54" />
          <div className="p-4">{children}</div>
        </div>
      </div>
      <Footer />
    </>
  );
}
