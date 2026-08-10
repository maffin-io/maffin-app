import React from 'react';
import Link from 'next/link';
import { BiCrown } from 'react-icons/bi';

import Tooltip from './Tooltip';

export type UpgradeTooltipProps = {
  id: string,
  message: string;
};

export default function UpgradeTooltip({
  id,
  message,
}: UpgradeTooltipProps): React.JSX.Element {
  return (
    <Tooltip
      id={id}
      className="max-w-80"
      clickable
    >
      <h2 className="flex font-normal items-center justify-center text-cyan-600">
        <BiCrown className="mr-1 font-thin" />
        Premium
      </h2>
      <div className="text-center">
        {message}
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
