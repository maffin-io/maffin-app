import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BiMenu } from 'react-icons/bi';

import Logo from '@/assets/images/logo-image.png';
import Modal from '@/components/ui/Modal';
import Menu from './Menu';

export default function LeftSideBar(): React.JSX.Element {
  return (
    <div>
      <div className="fixed flex bg-background-700 justify-center h-20 w-20 md:hidden z-10">
        <Modal
          className="flex justify-items-center bg-background-700 left-0 h-screen w-20 rounded-r-md"
          triggerContent={<BiMenu className="text-2xl" />}
        >
          <div className="pt-5">
            <Menu />
          </div>
        </Modal>
      </div>

      <div className="hidden md:inline-block fixed bg-background-700 left-0 text-center h-screen pt-20 w-20 pb-5 z-10">
        <Link href="/" className="fixed block top-0 h-20 w-20 z-2">
          <span className="flex justify-center items-center h-20">
            <Image src={Logo} alt="logo" height="40" />
          </span>
        </Link>

        <Menu />
      </div>
    </div>
  );
}
