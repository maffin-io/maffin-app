import React from 'react';
import { BiLoader } from 'react-icons/bi';

export default function Loading(): React.JSX.Element {
  return (
    <div className="flex h-full text-sm place-content-center place-items-center">
      <BiLoader className="text-3xl animate-spin" />
    </div>
  );
}
