import React from 'react';

import useGapiClient from '@/hooks/useGapiClient';
import type BookStorage from '@/lib/storage/BookStorage';
import {
  GDriveBookStorage,
  DemoBookStorage,
} from '@/lib/storage';
import useSession from './useSession';

type UseBookStorageReturn = {
  storage: BookStorage | null,
};

export default function useBookStorage(): UseBookStorageReturn {
  const [isGapiLoaded] = useGapiClient();
  const [storage, setStorage] = React.useState<BookStorage | null>(null);
  const { roles } = useSession();

  const [error, setError] = React.useState<Error | null>(null);
  if (error) {
    throw error;
  }

  React.useEffect(() => {
    async function load() {
      let instance: BookStorage = new DemoBookStorage();

      if (roles.isPremium) {
        instance = new GDriveBookStorage(window.gapi.client);
      }

      try {
        await instance.initStorage();
        setStorage(instance);
      } catch (e) {
        setError(e as Error);
      }
    }

    if (isGapiLoaded) {
      load();
    }
  }, [isGapiLoaded, roles.isPremium]);

  return { storage };
}
