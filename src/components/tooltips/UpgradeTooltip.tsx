import React from 'react';
import Link from 'next/link';
import { BiCrown } from 'react-icons/bi';

import Tooltip from './Tooltip';

export default function UpgradeTooltip(): JSX.Element {
  return (
    <Tooltip
      id="upgrade-tooltip"
      className="max-w-80"
      clickable
    >
      <h2 className="flex font-normal items-center justify-center text-cyan-600">
        <BiCrown className="mr-1 font-thin" />
        Premium
      </h2>
      <div className="text-center">
        Auto saving to persistent storage only available for premium users.
      </div>
      <Link
        href="https://maffin.io"
        target="_blank"
        className="btn btn-cta hover:text-white hover:-translate-y-0 table mx-auto my-4"
      >
        Check more
      </Link>
    </Tooltip>
  );
}
