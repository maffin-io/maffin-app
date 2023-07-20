import React from 'react';

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
  }, [isLoaded]);

  return [isLoaded];
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
    window.gapi.client.setToken({ access_token: localStorage.getItem('accessToken') as string });
    await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/people/v1/rest');
    await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
    callback(true);
  }
}
