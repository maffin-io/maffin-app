import React from 'react';

import { useDataSource, DataSourceContext } from '@/hooks';
import Loading from '@/components/Loading';
import Topbar from '@/layout/Topbar';

export default function DashboardPage({
  children,
}: React.PropsWithChildren): React.JSX.Element {
  const hookData = useDataSource();

  if (!hookData.isLoaded) {
    return (
      <div className="flex h-screen text-sm place-content-center place-items-center">
        <Loading />
      </div>
    );
  }

  return (
    <DataSourceContext.Provider value={hookData}>
      <Topbar />
      {children}
    </DataSourceContext.Provider>
  );
}
