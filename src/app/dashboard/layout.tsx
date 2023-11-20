'use client';

import React from 'react';
import Modal from 'react-modal';

import { useDataSource, DataSourceContext } from '@/hooks';
import useUser from '@/hooks/useUser';
import Footer from '@/layout/Footer';
import LeftSidebar from '@/layout/LeftSidebar';
import Topbar from '@/layout/Topbar';
import Loading from '@/components/Loading';
import { useTheme } from '@/hooks/state';

Modal.setAppElement('#modals');

export default function DashboardLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  const { user } = useUser();
  const { data: theme } = useTheme();
  const hookData = useDataSource();

  React.useLayoutEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  if (!user || !hookData.isLoaded || user.isLoggedIn === false) {
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
        <DataSourceContext.Provider value={hookData}>
          <Topbar />
          {children}
        </DataSourceContext.Provider>
      </div>
      <Footer />
    </div>
  );
}
