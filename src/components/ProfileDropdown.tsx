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
    <div
      className="group relative h-full px-3 hover:bg-background-800"
    >
      <button
        type="button"
        className="flex h-full w-full items-center"
      >
        {
          user && user.picture && (
            <Image
              src={user.picture as string}
              width={24}
              height={24}
              referrerPolicy="no-referrer"
              className="rounded-full md:mr-2 w-8 h-8"
              alt="user"
            />
          )
        }
        <div className="hidden md:inline-block">
          <p className="fontsemibold capitalize">
            {user?.name || '...'}
          </p>
          <p className="text-xs">
            {user?.email || ''}
          </p>
        </div>
      </button>

      <ul className="absolute right-0 md:left-0 rounded-md w-40 hidden py-1 group-hover:inline-block bg-background-700">
        <li className="text-sm hover:bg-background-800">
          <ImportButton
            className="text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap"
            role="menuitem"
          />
        </li>
        <li className="text-sm hover:bg-background-800">
          <ExportButton
            className="text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap"
            role="menuitem"
          />
        </li>
        <li className="block px-3 py-2 text-sm hover:bg-background-800">
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
