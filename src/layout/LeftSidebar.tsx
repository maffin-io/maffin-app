import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import Logo from '@/assets/images/logo-image.png';
import Menu from './Menu';

export default function LeftSideBar(): JSX.Element {
  return (
    <div className="fixed bg-background-700 text-center h-screen pt-20 w-20 pb-5 z-10">
      <Link href="/" className="fixed block top-0 h-20 w-20 z-2">
        <span className="flex justify-center items-center h-20">
          <Image src={Logo} alt="logo" height="40" />
        </span>
      </Link>

      <Menu />
    </div>
  );
}
