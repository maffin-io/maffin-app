'use client';

import React from 'react';
import Modal from 'react-modal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useDataSource, DataSourceContext } from '@/hooks';
import Footer from '@/layout/Footer';
import LeftSidebar from '@/layout/LeftSidebar';
import Topbar from '@/layout/Topbar';
import Loading from '@/components/Loading';
import { useTheme } from '@/hooks/state';
import useSession from '@/hooks/useSession';
import { useRouter } from 'next/navigation';

Modal.setAppElement('#modals');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      gcTime: 3600000,
    },
  },
});

export default function DashboardLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  const router = useRouter();
  const { data: theme } = useTheme();
  const hookData = useDataSource();
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

  if (!hookData.isLoaded) {
    return (
      <div className="flex h-screen text-sm place-content-center place-items-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <LeftSidebar />
      <div className="mt-20 ml-20 p-3 pb-7">
        <QueryClientProvider client={queryClient}>
          <DataSourceContext.Provider value={hookData}>
            <Topbar />
            {children}
          </DataSourceContext.Provider>
        </QueryClientProvider>
      </div>
      <Footer />
    </div>
  );
}
