import React from 'react';

export const metadata = {
  title: 'Home',
};

export default function AccountsLayout({
  children,
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <div>
      {children}
    </div>
  );
}
