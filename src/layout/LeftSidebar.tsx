import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SimpleBar from 'simplebar-react';

import maffinLogo from '@/assets/images/maffin_logo_sm.png';
import Menu from './Menu';

export default function LeftSideBar(): JSX.Element {
  return (
    <div className="fixed bg-gunmetal-700 text-center h-screen pt-20 w-20 z-1">
      <Link href="/" className="fixed block top-0 h-20 w-20 z-2">
        <span className="flex justify-center items-center h-20">
          <Image src={maffinLogo} alt="logo" height="45" />
        </span>
      </Link>

      <SimpleBar style={{ overflowX: 'hidden', maxHeight: '100%' }} scrollbarMaxSize={320}>
        <Menu />
      </SimpleBar>
    </div>
  );
}
