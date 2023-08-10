'use client';

import React from 'react';

import { useDataSource, DataSourceContext } from '@/hooks';
import useUser from '@/hooks/useUser';
import Footer from '@/layout/Footer';
import LeftSidebar from '@/layout/LeftSidebar';
import Topbar from '@/layout/Topbar';

export default function DashboardLayout({
  children,
}: React.PropsWithChildren): JSX.Element {
  const { user } = useUser();
  const hookData = useDataSource();

  if (!user || !hookData.isLoaded || user.isLoggedIn === false) {
    return <div>Loading...</div>;
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
      <Footer />
    </div>
  );
}
