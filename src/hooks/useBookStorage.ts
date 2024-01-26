import React from 'react';
import useGapiClient from '@/hooks/useGapiClient';
import { isDemo } from '@/helpers/env';
import type BookStorage from '@/lib/storage/BookStorage';
import GDriveBookStorage from '@/lib/storage/GDriveBookStorage';
import DemoBookStorage from '@/lib/storage/DemoBookStorage';

type UseBookStorageReturn = {
  storage: BookStorage | null,
};

export default function useBookStorage(): UseBookStorageReturn {
  const [isGapiLoaded] = useGapiClient();
  const [storage, setStorage] = React.useState<BookStorage | null>(null);

  React.useEffect(() => {
    async function load() {
      const instance = !isDemo()
        ? new GDriveBookStorage(window.gapi.client)
        : new DemoBookStorage();
      await instance.initStorage();
      setStorage(instance);
    }

    if (isGapiLoaded) {
      load();
    }
  }, [isGapiLoaded]);

  return { storage };
}
