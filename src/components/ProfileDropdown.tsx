import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BiLogOut } from 'react-icons/bi';

import { useUser } from '@/hooks';
import ImportButton from '@/components/buttons/ImportButton';

export default function ProfileDropdown(): JSX.Element {
  const { user } = useUser();

  return (
    <div className="group relative h-full pl-3 pr-4 rounded-t-sm hover:bg-gunmetal-800">
      <button
        type="button"
        className="flex h-full w-full pl-3 pr-4 items-center"
      >
        {
          user && user.image !== '' && (
            <Image
              src={user.image}
              width={24}
              height={24}
              referrerPolicy="no-referrer"
              className="rounded-full mx-2 w-8 h-8"
              alt="user"
            />
          )
        }
        <div>
          <p className="font-semibold capitalize">
            {user?.name || '...'}
          </p>
          <p className="text-xs">
            {user?.email || ''}
          </p>
        </div>
      </button>
      <ul className="absolute w-40 hidden bg-gunmetal-700 rounded-b-sm py-1 group-hover:block">
        <li className="px-3 py-2 text-sm hover:bg-gunmetal-800">
          <ImportButton />
        </li>
        <li className="block px-3 py-2 text-sm hover:bg-gunmetal-800">
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
