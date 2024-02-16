import React from 'react';
import RootLayout from '@/layout/RootLayout';

export const metadata = {
  title: {
    template: '%s | Maffin',
    default: 'Maffin',
  },
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

export default function Layout({
  children,
}: React.PropsWithChildren): JSX.Element {
  return <RootLayout>{children}</RootLayout>;
}
