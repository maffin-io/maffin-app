import React from 'react';

export const metadata = {
  title: 'Settings',
};

export default function SettingsLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  return (
    <div>
      {children}
    </div>
  );
}
