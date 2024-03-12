'use client';

import React from 'react';
import Modal from 'react-modal';
import { keepPreviousData, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';

import Footer from '@/layout/Footer';
import LeftSidebar from '@/layout/LeftSidebar';
import { useTheme } from '@/hooks/state';
import useSession from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/layout/DashboardPage';

Modal.setAppElement('#modals');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      refetchOnMount: true,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      placeholderData: keepPreviousData,
    },
  },
});

export default function DashboardLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  const router = useRouter();
  useTheme();
  const { isLoading, isAuthenticated } = useSession();

  React.useLayoutEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/user/login');
    }
  }, [router, isAuthenticated, isLoading]);

  return (
    <div className="w-full h-full overflow-hidden">
      <LeftSidebar />
      <div className="mt-20 ml-20 p-3 pb-7">
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <DashboardPage>
            <ErrorBoundary fallbackRender={({ error }) => error.show()}>
              {children}
            </ErrorBoundary>
          </DashboardPage>
        </QueryClientProvider>
      </div>
      <Footer />
    </div>
  );
}
