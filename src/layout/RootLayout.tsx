'use client';

import React from 'react';
import { Settings } from 'luxon';
import Script from 'next/script';
import { keepPreviousData, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import '@/css/globals.css';
import { Auth0Provider } from '@/lib/auth0-provider';
import { CONFIG, IS_DEMO_PLAN } from '@/helpers/env';

if (process.env.NODE_ENV === 'development') {
  Settings.throwOnInvalid = true;
}

if (IS_DEMO_PLAN) {
  Settings.now = () => 1703980800000; // 2023-12-31
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      gcTime: 60000, // 5 minutes
      // This doesnt work and needs to be set for each query.
      // It stops working when the navigation state changes. I.e. you start
      // online and then go to offline, subsequent queries are paused...
      networkMode: 'always',
      throwOnError: true,
      placeholderData: keepPreviousData,
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
          domain={CONFIG.auth0.domain}
          clientId={CONFIG.auth0.clientId}
          authorizationParams={{
            redirect_uri: (typeof window !== 'undefined' && window.location.origin) || '',
            scope: CONFIG.auth0.scopes,
            connection: 'maffin-gcp',
          }}
        >
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            {children}
          </QueryClientProvider>
        </Auth0Provider>
        <div id="modals" />
        <Toaster
          toastOptions={{
            className: 'text-sm bg-light text-light-600/90 dark:text-slate-400 dark:bg-dark-800',
            error: {
              duration: 7000,
            },
          }}
        />
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
