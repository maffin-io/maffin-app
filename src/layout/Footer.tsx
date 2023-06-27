import React from 'react';

export default function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bottom-0 w-full fixed flex justify-end bg-gunmetal-700 text-sm px-3 z-1">
      {currentYear}
      ©
      {' '}
      maffin.io
    </footer>
  );
}
