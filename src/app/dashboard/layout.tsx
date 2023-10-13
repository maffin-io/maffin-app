'use client';

import React from 'react';
import Modal from 'react-modal';

import { useDataSource, DataSourceContext } from '@/hooks';
import useUser from '@/hooks/useUser';
import Footer from '@/layout/Footer';
import LeftSidebar from '@/layout/LeftSidebar';
import Topbar from '@/layout/Topbar';

Modal.setAppElement('#modals');

export default function DashboardLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  const { user } = useUser();
  const hookData = useDataSource();

  if (!user || !hookData.isLoaded || user.isLoggedIn === false) {
    return (
      <div className="h-screen">
        <div className="flex text-sm h-3/4 place-content-center place-items-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <LeftSidebar />
      <div className="mt-20 ml-20 p-3 z-0">
        <DataSourceContext.Provider value={hookData}>
          <Topbar />
          {children}
        </DataSourceContext.Provider>
      </div>
      <div className="mt-2">
        <Footer />
      </div>
    </div>
  );
}
