'use client';

import React from 'react';
import { Settings } from 'luxon';
import Script from 'next/script';
import { keepPreviousData, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import '@/css/globals.css';
import Auth0Provider from '@/lib/auth0-provider';

if (process.env.NODE_ENV === 'development') {
  Settings.throwOnInvalid = true;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      gcTime: 300000, // 5 minutes
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
        <Auth0Provider>
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            {children}
          </QueryClientProvider>
        </Auth0Provider>
        <div id="modals" />
        <Toaster
          toastOptions={{
            className: 'text-sm',
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
