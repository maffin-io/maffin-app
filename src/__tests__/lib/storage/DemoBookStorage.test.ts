import pako from 'pako';

import BookStorage from '@/lib/storage/DemoBookStorage';

describe('DemoBookStorage', () => {
  let rawBook: Uint8Array;
  let instance: BookStorage;
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    rawBook = pako.gzip('rawBook');
    instance = new BookStorage();

    global.fetch = jest.fn();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initStorage', () => {
    it('inits storage', async () => {
      await instance.initStorage();
      expect(instance.fileName).toEqual('demo');
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => Promise.resolve({
          arrayBuffer: () => Promise.resolve(rawBook.buffer),
        })) as jest.Mock,
      );
      Object.defineProperty(window, 'location', {
        value: {
          host: 'demo.maffin.io',
        },
        writable: true,
      });

      await instance.initStorage();
    });

    it('returns decompressed data from downloaded file', async () => {
      const content = await instance.get();

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        '/books/demo.sqlite.gz',
        {
          headers: new Headers({
            'content-type': 'application/vnd.sqlite3',
          }),
          method: 'GET',
        },
      );
      expect(content).toEqual(pako.ungzip(rawBook));
    });

    it('returns empty data when domain not demo.maffin.io', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          host: 'app.maffin.io',
        },
        writable: true,
      });
      const content = await instance.get();

      expect(content).toEqual(new Uint8Array([]));
      window.location.host = 'localhost';
    });
  });

  describe('save', () => {
    it('does nothing', async () => {
      await instance.save();
    });
  });
});
