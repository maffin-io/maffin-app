'use client';

import React from 'react';

import Loading from '@/components/Loading';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    /**
     * We load the script this way rather than using next/script because
     * of an issue of the script not being reloaded when using next router
     * See more in https://github.com/vercel/next.js/discussions/17919
     */
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = async () => {
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (isLoading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  return (
    <div>
      {children}
    </div>
  );
}
