import React from 'react';

export const metadata = {
  title: 'Account | Maffin',
};

export default function AccountLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  return (
    <div>
      {children}
    </div>
  );
}
