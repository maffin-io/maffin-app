'use client';

import React from 'react';
import Modal from 'react-modal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      gcTime: 300000,
    },
  },
});

export default function DashboardLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  const router = useRouter();
  const { data: theme } = useTheme();
  const { isLoading, isAuthenticated } = useSession();

  React.useLayoutEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

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
            {children}
          </DashboardPage>
        </QueryClientProvider>
      </div>
      <Footer />
    </div>
  );
}
