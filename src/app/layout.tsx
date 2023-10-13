import React from 'react';
import { Settings } from 'luxon';

import '@/css/globals.css';

Settings.throwOnInvalid = true;

export const metadata = {
  title: 'maffin.io',
  description: 'Personal finance made easy',
  icons: {
    icon: [
      {
        url: '/favicon/favicon-32x32.png',
        type: 'image/png',
      },
      {
        url: '/favicon/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: '/favicon/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  return (
    <html lang="en" className="dark">
      <body data-leftbar-compact-mode="condensed">
        <noscript>You need to enable JavaScript to run this app.</noscript>
        {children}
        <div id="modals" />
      </body>
    </html>
  );
}
