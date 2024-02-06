import React from 'react';
import { Settings } from 'luxon';
import Script from 'next/script';

import '@/css/globals.css';
import { Auth0Provider } from '@/lib/auth0-provider';
import { isProd } from '@/helpers/env';

Settings.throwOnInvalid = true;

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

export default function RootLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  return (
    <html lang="en">
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <Auth0Provider
          domain={`maffin${isProd() ? '' : '-dev'}.eu.auth0.com`}
          clientId={isProd() ? 'cEXnN96kEP3ER2EDJjmjRW0u2MEFBUKK' : 'mMmnR4NbQOnim9B8QZfe9wfFuaKb8rwW'}
          authorizationParams={{
            redirect_uri: (typeof window !== 'undefined' && window.location.origin) || '',
            scope: 'profile email https://www.googleapis.com/auth/drive.file',
            connection: 'maffin-gcp',
          }}
        >
          {children}
        </Auth0Provider>
        <div id="modals" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${process.env.NEXT_PUBLIC_GTAG_ID}');
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GTAG_ID}`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
