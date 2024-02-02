import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

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
  // const { session } = useSession();
  const [isLoaded, setIsLoaded] = React.useState<boolean>(
    isBrowser && !!window.gapi && !!window.gapi.client,
  );
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  // const [accessToken, setAccessToken] = React.useState('');

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

  React.useEffect(() => {
    async function load() {
      const accessToken = await getAccessTokenSilently();
      console.log(accessToken);
    }

    console.log(isAuthenticated);
    load();
  }, [getAccessTokenSilently, isAuthenticated]);

  console.log(user);

  return [isLoaded && isAuthenticated];
  // /**
  //  * Whenever session or isLoaded changes, we reset the access_token
  //  * for the client.
  //  */
  // React.useEffect(() => {
  //   if (isLoaded && session) {
  //     window.gapi.client.setToken({ access_token: session.access_token });
  //     setAccessToken(session.access_token);
  //   }
  // }, [isLoaded, session]);

  // // eslint-disable-next-line no-unneeded-ternary
  // return [(isLoaded && accessToken) || isStaging() ? true : false];
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
