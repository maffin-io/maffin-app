'use client';

import React from 'react';
import Image from 'next/image';

import maffinLogo from '@/assets/images/maffin_logo_sm.png';
import { useTheme } from '@/hooks/state';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  useTheme();

  return (
    <div className="flex h-screen place-content-center place-items-center">
      <div className="card flex items-center">
        <Image className="m-0" src={maffinLogo} alt="" height="65" />
        <div className="mt-3 px-4">{children}</div>
      </div>
    </div>
  );
}
