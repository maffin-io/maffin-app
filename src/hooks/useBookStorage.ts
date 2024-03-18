import React from 'react';

import useGapiClient from '@/hooks/useGapiClient';
import { IS_FREE_PLAN, IS_PAID_PLAN } from '@/helpers/env';
import type BookStorage from '@/lib/storage/BookStorage';
import {
  GDriveBookStorage,
  DemoBookStorage,
  FreeBookStorage,
} from '@/lib/storage';

type UseBookStorageReturn = {
  storage: BookStorage | null,
};

export default function useBookStorage(): UseBookStorageReturn {
  const [isGapiLoaded] = useGapiClient();
  const [storage, setStorage] = React.useState<BookStorage | null>(null);

  const [error, setError] = React.useState<Error | null>(null);
  if (error) {
    throw error;
  }

  React.useEffect(() => {
    async function load() {
      let instance: BookStorage = new DemoBookStorage();

      if (IS_FREE_PLAN) {
        instance = new FreeBookStorage();
      }

      if (IS_PAID_PLAN) {
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
  }, [isGapiLoaded]);

  return { storage };
}
