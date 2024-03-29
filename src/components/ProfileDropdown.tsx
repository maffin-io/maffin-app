import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BiLogOut } from 'react-icons/bi';

import ImportButton from '@/components/buttons/ImportButton';
import ExportButton from '@/components/buttons/ExportButton';
import useSession from '@/hooks/useSession';

export default function ProfileDropdown(): JSX.Element {
  const { user } = useSession();

  return (
    <div className="group relative h-full bg-light-100/60 hover:bg-light-100 dark:bg-dark-800/50 dark:hover:bg-dark-800">
      <button
        type="button"
        className="flex h-full w-full pl-3 pr-4 items-center"
      >
        {
          user && user.picture && (
            <Image
              src={user.picture}
              width={24}
              height={24}
              referrerPolicy="no-referrer"
              className="rounded-full mx-2 w-8 h-8"
              alt="user"
            />
          )
        }
        <div>
          <p className="fontsemibold capitalize">
            {user?.name || '...'}
          </p>
          <p className="text-xs">
            {user?.email || ''}
          </p>
        </div>
      </button>
      <ul className="absolute rounded-md w-40 hidden py-1 group-hover:block bg-white dark:bg-dark-700 ">
        <li className="text-sm hover:bg-light-100 dark:hover:bg-dark-800">
          <ImportButton
            className="text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap"
            role="menuitem"
          />
        </li>
        <li className="text-sm hover:bg-light-100 dark:hover:bg-dark-800">
          <ExportButton
            className="text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap"
            role="menuitem"
          />
        </li>
        <li className="block px-3 py-2 text-sm hover:bg-light-100 dark:hover:bg-dark-800">
          <Link
            id="menu-item-1"
            role="menuitem"
            tabIndex={-1}
            href="/user/logout"
            className="inline-block w-full whitespace-nowrap"
          >
            <BiLogOut className="inline-block align-middle mr-1" />
            <span className="inline-block align-middle">Logout</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
