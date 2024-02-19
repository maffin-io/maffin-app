'use client';

import React from 'react';
import { Settings } from 'luxon';
import Script from 'next/script';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import '@/css/globals.css';
import { Auth0Provider } from '@/lib/auth0-provider';
import { isProd, isStaging } from '@/helpers/env';

if (isStaging()) {
  Settings.now = () => 1704067200000; // 2023-01-01
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      refetchOnMount: true,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      gcTime: 300000, // 5 minutes
    },
  },
});

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
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            {children}
          </QueryClientProvider>
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
