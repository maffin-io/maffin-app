'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import ProfileDropdown from '@/components/ProfileDropdown';
import DateRangeInput from '@/components/DateRangeInput';
import SaveButton from '@/components/buttons/SaveButton';
import { AccountSelector } from '@/components/selectors';
import ThemeButton from '@/components/buttons/ThemeButton';
import type { Account } from '@/book/entities';

export default function Topbar(): JSX.Element {
  const router = useRouter();

  return (
    <div className="flex justify-end lg:justify-between items-center bg-white dark:bg-dark-700 shadow-sm h-20 fixed z-10 top-0 pl-6 left-20 right-0">
      <div className="hidden lg:inline-block lg:w-1/4">
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

      <div className="flex h-full gap-x-4 items-center">
        <span className="hidden lg:inline-block">
          <DateRangeInput />
        </span>
        <span className="hidden lg:inline-block">
          <SaveButton />
        </span>
        <div className="hidden lg:inline-block">
          <ThemeButton />
        </div>
        <div className="h-full justify-self-end">
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
}
