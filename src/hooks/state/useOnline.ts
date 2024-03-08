import React from 'react';

/**
 * Checks that we are online and have a valid google access token so we can enable
 * write functionality (save button, add transaction, etc).
 */
export function useOnline(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = React.useState(window.navigator.onLine);

  React.useEffect(() => {
    function listener() {
      setIsOnline(window.navigator.onLine);
    }

    window.addEventListener('online', listener);
    window.addEventListener('offline', listener);

    return () => {
      window.removeEventListener('online', listener);
      window.removeEventListener('offline', listener);
    };
  }, []);

  return {
    isOnline,
  };
}
