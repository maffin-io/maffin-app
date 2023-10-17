'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import ProfileDropdown from '@/components/ProfileDropdown';
import SaveButton from '@/components/buttons/SaveButton';
import { AccountSelector } from '@/components/selectors';
import ThemeButton from '@/components/buttons/ThemeButton';
import type { Account } from '@/book/entities';

export default function Topbar(): JSX.Element {
  const router = useRouter();

  return (
    <div className="grid grid-cols-12 bg-white dark:bg-dark-700 shadow-sm h-20 fixed z-10 top-0 px-6 left-20 right-0">
      <div className="col-span-3">
        <AccountSelector
          id="globalSearch"
          className="py-5 pl-1"
          placeholder="Search (cmd + k)..."
          ignoreHidden={false}
          onChange={(selected: Account | null) => {
            if (selected) {
              router.push(`/dashboard/accounts/${selected.guid}`);
            }
          }}
        />
      </div>

      <div className="col-span-9">
        <div className="flex h-full items-center justify-end">
          <div className="px-2">
            <SaveButton />
          </div>
          <div className="px-2">
            <ThemeButton />
          </div>
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
}
