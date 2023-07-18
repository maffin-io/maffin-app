import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { BiLogOut, BiImport } from 'react-icons/bi';

import type BookStorage from '@/apis/BookStorage';
import { useUser, useBookStorage } from '@/hooks';

export default function ProfileDropdown(): JSX.Element {
  const [bookStorage] = useBookStorage();
  const { user } = useUser();

  const fileImportInput = React.useRef<HTMLInputElement>(null);

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
          <button
            id="menu-item-0"
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="link inline-block w-full whitespace-nowrap"
            onClick={() => fileImportInput.current !== null && fileImportInput.current.click()}
          >
            <BiImport className="inline-block align-middle mr-1" />
            <span className="inline-block align-middle">Import</span>
          </button>
          <input
            type="file"
            ref={fileImportInput}
            onChange={(e) => importBook(e, bookStorage)}
            style={{ display: 'none' }}
          />
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

async function importBook(
  event: React.ChangeEvent<HTMLInputElement>,
  bookStorage: BookStorage | null,
) {
  if (event.target.files !== null && event.target.files[0] !== null) {
    const fileReader = new FileReader();
    fileReader.onload = async (loadEvent) => {
      if (loadEvent.target !== null && loadEvent.target.result !== null) {
        if (bookStorage === null) {
          throw new Error('Failed saving, bookStorage is null');
        }
        const rawBook = new Uint8Array(loadEvent.target.result as ArrayBuffer);
        await bookStorage.save(rawBook);
        // TODO: need to re-render the page and reload datasource!
      }
    };

    fileReader.readAsArrayBuffer(event.target.files[0]);
  }
}
