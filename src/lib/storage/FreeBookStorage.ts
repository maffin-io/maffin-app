import BookStorage from '@/lib/storage/BookStorage';

export default class FreeBookStorage implements BookStorage {
  fileName: string;

  async initStorage(): Promise<void> {
    this.fileName = 'free';
  }

  // eslint-disable-next-line class-methods-use-this
  async get(): Promise<Uint8Array> {
    return new Uint8Array([]);
  }

  // eslint-disable-next-line class-methods-use-this
  async save(): Promise<void> {
    'ok';
  }
}
