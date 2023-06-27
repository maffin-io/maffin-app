import React from 'react';
import { BiCloudUpload } from 'react-icons/bi';

import { useBookStorage, useDataSource } from '@/hooks';

export default function SaveButton(): JSX.Element {
  const [bookStorage] = useBookStorage();
  const [datasource] = useDataSource();

  if (bookStorage === null || datasource === null) {
    return (
      <button
        type="button"
        className="btn-primary"
      >
        ...
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn-primary"
      onClick={async () => {
        const rawBook = datasource?.sqljsManager.exportDatabase();
        await bookStorage?.save(rawBook);
      }}
    >
      <BiCloudUpload className="mr-1" />
      Save
    </button>
  );
}
