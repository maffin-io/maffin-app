import React from 'react';

import { isStaging } from '@/helpers/env';
import useSession from './useSession';

const isBrowser = typeof window !== 'undefined';

/**
 * Use this in any component that needs Gapi. This will make sure we load GAPI and trigger the
 * callback so a re-render happens. A typical use case:
 *
 * const [isGapiLoaded] = useGapiClient();
 * if (isGapiLoaded) {
 *    <do your stuff>
 * }
 */
export default function useGapiClient() {
  const [isLoaded, setIsLoaded] = React.useState<boolean>(
    isBrowser && !!window.gapi && !!window.gapi.client,
  );
  const { accessToken } = useSession();

  React.useEffect(() => {
    if (!window.gapi || !window.gapi.client) {
      const script = document.createElement('script');

      script.id = 'maffin-gapi';
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.onload = async () => loadGapiClient(setIsLoaded);

      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }

    return () => {};
  }, []);

  /**
   * Whenever session or isLoaded changes, we reset the access_token
   * for the client.
   */
  React.useEffect(() => {
    if (isLoaded && accessToken) {
      window.gapi.client.setToken({ access_token: accessToken });
    }
  }, [isLoaded, accessToken]);

  // eslint-disable-next-line no-unneeded-ternary
  return [(isLoaded && accessToken) || isStaging() ? true : false];
}

/**
 * This function makes sure gapi client is properly loaded together with the
 * client apis we will be using.
 */
async function loadGapiClient(callback: React.Dispatch<React.SetStateAction<boolean>>) {
  if (!window.gapi.client) {
    await new Promise((res) => {
      if (window.gapi) {
        window.gapi.load('client', res);
      }
    });

    await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
    callback(true);
  }
}
