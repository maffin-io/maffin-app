'use client';

import {
  BiHomeAlt,
  BiLineChart,
} from 'react-icons/bi';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_ITEMS = [
  {
    label: 'Home',
    icon: <BiHomeAlt className="text-xl" />,
    url: '/dashboard/accounts',
  },
  {
    label: 'Investments',
    icon: <BiLineChart className="text-xl" />,
    url: '/dashboard/investments',
  },
];

type MenuItemProps = {
  item: {
    url: string;
    icon: JSX.Element;
    label: string;
    submenu?: { label: string, url: string }[],
  },
  className: string,
};

export default function DashboardMenu(): JSX.Element {
  const pathname = usePathname();

  return (
    <ul>
      {MENU_ITEMS.map((item, idx) => (
        <MenuItem
          key={idx}
          item={item}
          className={pathname === item.url ? 'text-white' : ''}
        />
      ))}
    </ul>
  );
}

function MenuItem({ item, className }: MenuItemProps): JSX.Element {
  return (
    <li className="group h-12 text-slate-400 hover:bg-cyan-700 hover:text-white hover:w-64 hover:rounded-r-sm">
      <Link
        href={item.url}
        className="flex items-center text-inherit hover:text-inherit h-full px-8 py-4"
      >
        <span className={`mr-8 ${className}`}>
          {item.icon}
        </span>
        <span className="hidden group-hover:inline-block ml-1">
          {item.label}
        </span>
      </Link>
      <SubMenu items={item.submenu} />
    </li>
  );
}

function SubMenu({
  items,
}: {
  items: { label: string, url: string }[] | undefined,
}): JSX.Element {
  if (items && items.length) {
    return (
      <ul className="hidden float-right w-44 bg-dark-700 shadow-md group-hover:inline-block">
        <li className="text-sm ml-2 text-left py-2">
          <Link
            href="/settings/commodities"
            className="text-slate-400 hover:text-white"
          >
            Commodities
          </Link>
        </li>
      </ul>
    );
  }

  return <span />;
}
