import React from 'react';

export const metadata = {
  title: 'Home',
};

export default function AccountsLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  return (
    <div>
      {children}
    </div>
  );
}
