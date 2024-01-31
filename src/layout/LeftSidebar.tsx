import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import maffinLogo from '@/assets/images/maffin_logo_sm.png';
import Menu from './Menu';

export default function LeftSideBar(): JSX.Element {
  return (
    <div className="fixed bg-dark-700 text-center h-screen pt-20 w-20 pb-5 z-10">
      <Link href="/" className="fixed block top-0 h-20 w-20 z-2">
        <span className="flex justify-center items-center ml-6 h-20">
          <Image src={maffinLogo} alt="logo" height="65" />
        </span>
      </Link>

      <Menu />
    </div>
  );
}
