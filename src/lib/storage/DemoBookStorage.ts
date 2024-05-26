import pako from 'pako';
import { Settings } from 'luxon';

import BookStorage from '@/lib/storage/BookStorage';

export default class DemoBookStorage implements BookStorage {
  fileName: string;

  async initStorage(): Promise<void> {
    this.fileName = 'demo';
  }

  async get(): Promise<Uint8Array> {
    if (!(window.location.host === 'demo.maffin.io')) {
      return new Uint8Array([]);
    }

    // When we show demo data, we set modify DateTime.now
    // so it shows the stored data
    Settings.now = () => 1703980800000; // 2023-12-31
    const response = await fetch(
      `/books/${this.fileName}.sqlite.gz`,
      {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/vnd.sqlite3',
        }),
      },
    );
    const binaryContent = await response.arrayBuffer();

    const data = pako.ungzip(binaryContent) || new Uint8Array();
    return data;
  }

  // eslint-disable-next-line class-methods-use-this
  async save(): Promise<void> {
    'ok';
  }
}
