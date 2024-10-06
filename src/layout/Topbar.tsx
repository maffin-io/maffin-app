'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import ProfileDropdown from '@/components/ProfileDropdown';
import DateRangeInput from '@/components/DateRangeInput';
import SaveButton from '@/components/buttons/SaveButton';
import { AccountSelector } from '@/components/selectors';
import ThemeButton from '@/components/buttons/ThemeButton';
import { useQueryClient } from '@tanstack/react-query';
import { useInterval } from '@/hooks/state';
import type { Account } from '@/book/entities';

export default function Topbar(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: interval } = useInterval();

  return (
    <div className="fixed flex justify-end lg:justify-between items-center bg-background-700 shadow-sm h-20 z-10 left-20 right-0 top-0">
      <div className="hidden lg:inline-block lg:w-1/4 lg:pl-3">
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
          <DateRangeInput
            interval={interval}
            onChange={
              (newValue) => {
                if (newValue) {
                  queryClient.setQueryData(['state', 'interval'], newValue);
                }
              }
            }
          />
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
