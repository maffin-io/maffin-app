'use client';

import { BiHomeAlt, BiCoinStack } from 'react-icons/bi';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_ITEMS = [
  {
    label: 'Home',
    icon: <BiHomeAlt size="1.125em" />,
    url: '/dashboard/accounts',
  },
  {
    label: 'Investments',
    icon: <BiCoinStack size="1.125em" />,
    url: '/dashboard/investments',
  },
];

type MenuItemProps = {
  item: {
    url: string;
    target?: string;
    icon: JSX.Element;
    label: string;
  },
  className: string,
};

function MenuItem({ item, className }: MenuItemProps): JSX.Element {
  return (
    <li className="relative hover:text-white">
      <Link
        href={item.url}
        target={item.target}
        className="block pt-3 pb-3"
      >
        <span className={`flex justify-center cursor-pointer items-center w-20 ${className} text-slate-400 hover:text-white`}>
          {item.icon}
        </span>
      </Link>
    </li>
  );
}

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
