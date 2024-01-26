import pako from 'pako';

import BookStorage from '@/lib/storage/BookStorage';

export default class DemoBookStorage implements BookStorage {
  fileName: string;

  async initStorage(): Promise<void> {
    this.fileName = 'demo';
  }

  async get(): Promise<Uint8Array> {
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
