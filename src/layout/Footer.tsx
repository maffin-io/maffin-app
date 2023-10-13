import React from 'react';

export default function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bottom-0 w-full flex justify-end bg-white dark:bg-dark-700 text-sm px-5 z-1">
      {currentYear}
      ©
      {' '}
      maffin.io
    </footer>
  );
}
