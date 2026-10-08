'use client';

import React from 'react';
import Modal from 'react-modal';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';

import Footer from '@/layout/Footer';
import LeftSidebar from '@/layout/LeftSidebar';
import { useTheme } from '@/hooks/state';
import useSession from '@/hooks/useSession';
import DashboardPage from '@/layout/DashboardPage';
import { MaffinError } from '@/helpers/errors';

Modal.setAppElement('#modals');

export default function DashboardLayout({
  children,
}: React.PropsWithChildren): React.JSX.Element {
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
      <div className="mt-20 md:ml-20 p-3 pb-7">
        <ErrorBoundary
          FallbackComponent={ErrorComponent}
          onError={(error) => {
            if (!(error instanceof MaffinError)) {
              error = new MaffinError(error.message, 'UNKNOWN');
            }
            (error as MaffinError).show();
          }}
        >
          <DashboardPage>
            {children}
          </DashboardPage>
        </ErrorBoundary>
      </div>
      <Footer />
    </div>
  );
}

function ErrorComponent(): React.JSX.Element {
  return <span />;
}
