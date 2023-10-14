import React from 'react';
import { BiLoader } from 'react-icons/bi';

export default function Loading(): JSX.Element {
  return (
    <BiLoader className="text-3xl animate-spin" />
  );
}
