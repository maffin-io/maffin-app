import React from 'react';
import useGapiClient from '@/hooks/useGapiClient';
import BookStorage from '@/apis/BookStorage';

export default function useBookStorage(): [BookStorage | null] {
  const [isGapiLoaded] = useGapiClient();
  const [storage, setStorage] = React.useState<BookStorage | null>(null);

  React.useEffect(() => {
    async function load() {
      const instance = new BookStorage(window.gapi.client);
      await instance.initStorage();
      setStorage(instance);
    }

    if (isGapiLoaded) {
      load();
    }
  }, [isGapiLoaded]);

  return [storage || null];
}
