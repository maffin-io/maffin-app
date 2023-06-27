import React from 'react';
import { DataSource } from 'typeorm';

import useBookStorage from '@/hooks/useBookStorage';
import { initDB } from '@/book/datasource';

// Not sure if this is the best way to cache the storage...
// need to research
let DATASOURCE: DataSource | null = null;

export default function useDataSource(): [DataSource | null] {
  const [bookStorage] = useBookStorage();
  const [, setDataSource] = React.useState<DataSource | null>(DATASOURCE);
  const isInitializing = React.useRef(false);

  React.useEffect(() => {
    async function load() {
      if (bookStorage && DATASOURCE == null && !isInitializing.current) {
        isInitializing.current = true;
        let start;
        let end;

        start = performance.now();
        const rawBook = await bookStorage.get();
        end = performance.now();

        start = performance.now();
        // We re-check here to avoid race conditions because of
        // downloading book data takes time. Without this
        // we have some reference errors where a component may
        // use one instance another the difference instance which
        // causes synchronization issues.
        if (DATASOURCE === null) {
          DATASOURCE = await initDB(rawBook);
          end = performance.now();
          console.log(`init dataSource: ${end - start}ms`);
        }
        setDataSource(DATASOURCE);
        isInitializing.current = false;
      }
    }

    load();
  }, [bookStorage]);

  return [DATASOURCE];
}
