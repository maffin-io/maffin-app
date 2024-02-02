'use client';

import React from 'react';
import { Settings } from 'luxon';
import Script from 'next/script';
import { Auth0Provider } from '@auth0/auth0-react';

import '@/css/globals.css';

Settings.throwOnInvalid = true;

// export const metadata = {
//   title: 'maffin.io',
//   description: 'Personal finance made easy',
//   icons: {
//     icon: [
//       {
//         url: '/favicon/favicon-32x32.png',
//         type: 'image/png',
//       },
//       {
//         url: '/favicon/favicon-16x16.png',
//         sizes: '16x16',
//         type: 'image/png',
//       },
//       {
//         url: '/favicon/favicon-32x32.png',
//         sizes: '32x32',
//         type: 'image/png',
//       },
//     ],
//     apple: '/favicon/apple-touch-icon.png',
//   },
// };

export default function RootLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  return (
    <html lang="en">
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <Auth0Provider
          domain="maffin.eu.auth0.com"
          clientId="cEXnN96kEP3ER2EDJjmjRW0u2MEFBUKK"
          authorizationParams={{
            redirect_uri: 'http://localhost:3000',
            scope: 'profile email https://www.googleapis.com/auth/drive.file',
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
