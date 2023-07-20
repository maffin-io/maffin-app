import React from 'react';
import { BiImport } from 'react-icons/bi';
import { DataSource } from 'typeorm';
import { mutate } from 'swr';

import { useDataSource, useBookStorage } from '@/hooks';
import {
  Account,
  Book,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import type BookStorage from '@/apis/BookStorage';

export default function ImportButton(): JSX.Element {
  const [storage] = useBookStorage();
  const [datasource] = useDataSource();
  const fileImportInput = React.useRef<HTMLInputElement>(null);
  const isDisabled = !storage;

  return (
    <>
      <button
        id="menu-item-0"
        type="button"
        role="menuitem"
        disabled={isDisabled}
        tabIndex={-1}
        className="link inline-block w-full whitespace-nowrap"
        onClick={() => fileImportInput.current !== null && fileImportInput.current.click()}
      >
        <BiImport className="inline-block align-middle mr-1" />
        <span className="inline-block align-middle">Import</span>
      </button>
      <input
        aria-label="importInput"
        className="hidden"
        type="file"
        ref={fileImportInput}
        onChange={(e) => importBook(
          e,
          storage as BookStorage,
          datasource as DataSource,
        )}
      />
    </>
  );
}

function importBook(
  event: React.ChangeEvent<HTMLInputElement>,
  storage: BookStorage,
  datasource: DataSource,
) {
  if (event.target.files !== null && event.target.files[0] !== null) {
    const fileReader = new FileReader();
    fileReader.onload = async (loadEvent) => {
      if (loadEvent.target !== null && loadEvent.target.result !== null) {
        const rawBook = new Uint8Array(loadEvent.target.result as ArrayBuffer);
        await saveBook(rawBook, storage, datasource);
      }
    };

    fileReader.readAsArrayBuffer(event.target.files[0]);
  }
}

/**
 * Receives a Uint8Array from the file to import, converts it
 * to Maffin schema using a temporary datasource and uploads the resulting
 * data.
 */
async function saveBook(
  rawData: Uint8Array,
  storage: BookStorage,
  datasource: DataSource,
) {
  const tempDataSource = new DataSource({
    type: 'sqljs',
    synchronize: true,
    database: rawData,
    logging: false,
    entities: [Account, Book, Commodity, Price, Split, Transaction],
  });
  await tempDataSource.initialize();
  const rawBook = tempDataSource.sqljsManager.exportDatabase();

  await Promise.all([
    datasource.sqljsManager.loadDatabase(rawBook),
    storage.save(rawBook),
  ]);

  mutate(() => true);
}
